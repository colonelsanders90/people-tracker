"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, count } from "drizzle-orm";
import {
  db,
  postings,
  roles,
  units,
  individuals,
} from "@/lib/db";
import type { Level, PostingStatus } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_STATUSES: PostingStatus[] = [
  "Past",
  "Current",
  "Planned",
  "Candidate",
];
const VALID_LEVELS: Level[] = ["L1", "L2", "L3"];

function txt(value: FormDataEntryValue | null): string | null {
  const v = typeof value === "string" ? value.trim() : "";
  return v === "" ? null : v;
}

function reqTxt(value: FormDataEntryValue | null, label: string): string {
  const v = txt(value);
  if (!v) throw new Error(`${label} is required`);
  return v;
}

function num(value: FormDataEntryValue | null): number | null {
  const v = typeof value === "string" ? value : "";
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function bool(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

function status(value: FormDataEntryValue | null): PostingStatus {
  const v = typeof value === "string" ? value : "";
  if (!VALID_STATUSES.includes(v as PostingStatus)) {
    throw new Error(`Invalid status: ${v}`);
  }
  return v as PostingStatus;
}

function level(value: FormDataEntryValue | null): Level {
  const v = typeof value === "string" ? value : "";
  if (!VALID_LEVELS.includes(v as Level)) {
    throw new Error(`Invalid level: ${v}`);
  }
  return v as Level;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Validate posting dates by status. Returns an error string if invalid, null
 * if OK. Past requires both dates; any pair must satisfy end >= start.
 */
function validatePostingDates(
  s: PostingStatus,
  startDate: string | null,
  endDate: string | null,
): string | null {
  if (s === "Past" && (!startDate || !endDate)) {
    return "Past postings require both a start and an end date.";
  }
  if (startDate && endDate && endDate < startDate) {
    return "End date must be on or after the start date.";
  }
  return null;
}

/**
 * Demote any other Current posting on this role to Past, with end_date set
 * to the new posting's start (or today). Used by createPosting and
 * updatePosting whenever a role gains a new Current incumbent.
 */
async function demoteOtherCurrents(
  roleId: number,
  handoffStartDate: string | null,
  excludePostingId: number | null,
): Promise<void> {
  const handoffDate = handoffStartDate ?? todayIso();
  const condition = excludePostingId
    ? and(
        eq(postings.roleId, roleId),
        eq(postings.status, "Current"),
        ne(postings.id, excludePostingId),
      )
    : and(eq(postings.roleId, roleId), eq(postings.status, "Current"));
  await db
    .update(postings)
    .set({ status: "Past", endDate: handoffDate })
    .where(condition);
}

/**
 * Re-derive role.isVacant from "no Current posting on this role". Call after
 * any posting create/update/delete that touches a role's Current state.
 */
async function syncRoleVacancy(
  roleId: number,
  excludePostingId: number | null = null,
): Promise<void> {
  const condition = excludePostingId
    ? and(
        eq(postings.roleId, roleId),
        eq(postings.status, "Current"),
        ne(postings.id, excludePostingId),
      )
    : and(eq(postings.roleId, roleId), eq(postings.status, "Current"));
  const [{ c }] = await db
    .select({ c: count() })
    .from(postings)
    .where(condition);
  await db.update(roles).set({ isVacant: c === 0 }).where(eq(roles.id, roleId));
}

/**
 * Server Action result shape for actions that may fail in expected ways
 * (FK guards, referenced rows, etc). Returning a plain object preserves the
 * error message across the client/server boundary — Next.js otherwise strips
 * `Error.message` from thrown errors in production.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };

function fanoutPaths(...extra: string[]) {
  for (const p of [
    "/",
    "/org",
    "/individuals",
    "/roles",
    "/admin",
    "/admin/postings",
    "/admin/people",
    ...extra,
  ]) {
    revalidatePath(p);
  }
}

// ---------------------------------------------------------------------------
// Postings
// ---------------------------------------------------------------------------

/**
 * Create a posting. Supports four flow combinations:
 *   - Internal individual ↔ internal role
 *   - External individual ↔ internal role  (e.g. someone joining RAiD)
 *   - Internal individual ↔ external role  (e.g. someone leaving RAiD)
 *   - External individual ↔ external role  (rarely useful, allowed)
 *
 * External entities are created on-the-fly in the same transaction-ish
 * flow and reused on the resulting posting.
 */
export async function createPosting(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const externalIndividual = bool(formData.get("externalIndividual"));
  const externalRole = bool(formData.get("externalRole"));
  const newStatus = status(formData.get("status"));
  const startDate = txt(formData.get("startDate"));
  const endDate =
    newStatus === "Current" ? null : txt(formData.get("endDate"));
  const notes = txt(formData.get("notes"));

  const dateError = validatePostingDates(newStatus, startDate, endDate);
  if (dateError) return { ok: false, error: dateError };

  // Resolve / create individual
  let individualId: number;
  if (externalIndividual) {
    const name = reqTxt(formData.get("externalIndividualName"), "Person name");
    const rank = txt(formData.get("externalIndividualRank"));
    const [created] = await db
      .insert(individuals)
      .values({ name, rank, isExternal: true })
      .returning();
    individualId = created.id;
  } else {
    const id = num(formData.get("individualId"));
    if (id == null) return { ok: false, error: "Individual is required" };
    individualId = id;
  }

  // Resolve / create role
  let roleId: number;
  if (externalRole) {
    const title = reqTxt(formData.get("externalRoleTitle"), "Role title");
    const subUnit = reqTxt(formData.get("externalRoleUnit"), "Sub-unit");
    const [created] = await db
      .insert(roles)
      .values({
        title,
        externalUnit: subUnit,
        unitId: null,
        isExternal: true,
        level: "L3",
      })
      .returning();
    roleId = created.id;
  } else {
    const id = num(formData.get("roleId"));
    if (id == null) return { ok: false, error: "Role is required" };
    roleId = id;
  }

  // Single-Current invariant: if creating a Current, demote any other Current
  // posting on the same role to Past with a clean handoff date.
  if (newStatus === "Current") {
    await demoteOtherCurrents(roleId, startDate, null);
  }

  await db.insert(postings).values({
    individualId,
    roleId,
    status: newStatus,
    startDate,
    endDate,
    notes,
  });

  // Re-derive isVacant from posting state.
  await syncRoleVacancy(roleId);

  fanoutPaths(`/individuals/${individualId}`, `/roles/${roleId}`);
  return { ok: true };
}

/**
 * Update an existing posting's status / dates / notes.
 * The role and individual cannot be changed — to move a posting, delete and
 * recreate. Status transitions to/from "Current" trigger the same single-
 * Current and isVacant-sync invariants as createPosting.
 */
export async function updatePosting(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) return { ok: false, error: "id is required" };

  const [existing] = await db
    .select()
    .from(postings)
    .where(eq(postings.id, id))
    .limit(1);
  if (!existing) return { ok: false, error: "Posting not found" };

  const newStatus = status(formData.get("status"));
  const newStartDate = txt(formData.get("startDate"));
  const newEndDate =
    newStatus === "Current" ? null : txt(formData.get("endDate"));
  const newNotes = txt(formData.get("notes"));

  const dateError = validatePostingDates(newStatus, newStartDate, newEndDate);
  if (dateError) return { ok: false, error: dateError };

  // Transitioning INTO Current → demote any other Current on the same role
  if (newStatus === "Current" && existing.status !== "Current") {
    await demoteOtherCurrents(existing.roleId, newStartDate, id);
  }

  await db
    .update(postings)
    .set({
      status: newStatus,
      startDate: newStartDate,
      endDate: newEndDate,
      notes: newNotes,
    })
    .where(eq(postings.id, id));

  // Re-derive isVacant after any status change
  if (existing.status !== newStatus) {
    await syncRoleVacancy(existing.roleId);
  }

  fanoutPaths(
    `/individuals/${existing.individualId}`,
    `/roles/${existing.roleId}`,
  );
  return { ok: true };
}

export async function deletePosting(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) throw new Error("id is required");

  const existing = (
    await db.select().from(postings).where(eq(postings.id, id)).limit(1)
  )[0];

  await db.delete(postings).where(eq(postings.id, id));

  // If the deleted posting was the role's Current, the role may have just
  // gone vacant. Re-derive.
  if (existing && existing.status === "Current") {
    await syncRoleVacancy(existing.roleId);
  }

  fanoutPaths(
    ...(existing
      ? [
          `/individuals/${existing.individualId}`,
          `/roles/${existing.roleId}`,
        ]
      : []),
  );
}

// ---------------------------------------------------------------------------
// Units (branches)
// ---------------------------------------------------------------------------

/** Create a new L2 branch under the given parent (defaults to RAiD L1). */
export async function createBranch(formData: FormData) {
  await requireAdmin();
  const name = reqTxt(formData.get("name"), "Branch name");
  const parentUnitId = num(formData.get("parentUnitId"));
  const headTitle = txt(formData.get("headTitle"));

  if (parentUnitId == null) throw new Error("parentUnitId is required");

  const [unit] = await db
    .insert(units)
    .values({ name, level: "L2", parentUnitId })
    .returning();

  // If a head title was supplied, atomically create the branch head role.
  if (headTitle) {
    await db.insert(roles).values({
      title: headTitle,
      unitId: unit.id,
      level: "L2",
      isHead: true,
    });
  }

  fanoutPaths();
}

export async function renameUnit(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"));
  const name = reqTxt(formData.get("name"), "Name");
  if (id == null) throw new Error("id is required");

  await db.update(units).set({ name }).where(eq(units.id, id));
  fanoutPaths();
}

export async function deleteUnit(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) return { ok: false, error: "id is required" };

  const [{ c }] = await db
    .select({ c: count() })
    .from(roles)
    .where(eq(roles.unitId, id));
  if (c > 0) {
    return {
      ok: false,
      error: `Can't delete this branch — it still has ${c} role${c === 1 ? "" : "s"}. Remove the roles first.`,
    };
  }

  await db.delete(units).where(eq(units.id, id));
  fanoutPaths();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export async function createRole(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const title = reqTxt(formData.get("title"), "Role title");
  const unitId = num(formData.get("unitId"));
  let lvl = level(formData.get("level"));
  const isHead = bool(formData.get("isHead"));
  const specialisation = txt(formData.get("specialisation"));
  const establishmentRank = txt(formData.get("establishmentRank"));
  const establishmentVocation = txt(formData.get("establishmentVocation"));

  if (unitId == null) return { ok: false, error: "unitId is required" };

  // Head invariants: head's level must match its unit, and a unit can have
  // at most one head — demote any existing head before inserting the new one.
  if (isHead) {
    const [parent] = await db
      .select()
      .from(units)
      .where(eq(units.id, unitId))
      .limit(1);
    if (!parent) return { ok: false, error: "Unit not found" };
    lvl = parent.level;
    await db
      .update(roles)
      .set({ isHead: false })
      .where(and(eq(roles.unitId, unitId), eq(roles.isHead, true)));
  }

  await db.insert(roles).values({
    title,
    unitId,
    level: lvl,
    isHead,
    specialisation,
    establishmentRank,
    establishmentVocation,
  });

  fanoutPaths();
  return { ok: true };
}

export async function updateRole(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) return { ok: false, error: "id is required" };

  const [existing] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1);
  if (!existing) return { ok: false, error: "Role not found" };

  const isHead = bool(formData.get("isHead"));

  const updates: {
    title: string;
    isHead: boolean;
    specialisation: string | null;
    establishmentRank: string | null;
    establishmentVocation: string | null;
    level?: Level;
  } = {
    title: reqTxt(formData.get("title"), "Role title"),
    isHead,
    specialisation: txt(formData.get("specialisation")),
    establishmentRank: txt(formData.get("establishmentRank")),
    establishmentVocation: txt(formData.get("establishmentVocation")),
  };

  // Head invariants: when promoting to head, snap level to unit's level and
  // demote any existing head on the same unit.
  if (isHead && existing.unitId != null) {
    const [parent] = await db
      .select()
      .from(units)
      .where(eq(units.id, existing.unitId))
      .limit(1);
    if (parent) {
      updates.level = parent.level;
      await db
        .update(roles)
        .set({ isHead: false })
        .where(
          and(
            eq(roles.unitId, existing.unitId),
            eq(roles.isHead, true),
            ne(roles.id, id),
          ),
        );
    }
  }

  await db.update(roles).set(updates).where(eq(roles.id, id));

  fanoutPaths(`/roles/${id}`);
  return { ok: true };
}

export async function deleteRole(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) return { ok: false, error: "id is required" };

  const [{ c }] = await db
    .select({ c: count() })
    .from(postings)
    .where(eq(postings.roleId, id));
  if (c > 0) {
    return {
      ok: false,
      error: `Can't delete this role — ${c} posting${c === 1 ? "" : "s"} still reference it. Remove the postings on Admin → Postings first.`,
    };
  }

  await db.delete(roles).where(eq(roles.id, id));
  fanoutPaths();
  return { ok: true };
}

export async function toggleRoleVacancy(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"));
  const isVacant = formData.get("isVacant") === "true";
  if (id == null) throw new Error("id is required");

  await db.update(roles).set({ isVacant: !isVacant }).where(eq(roles.id, id));
  fanoutPaths(`/roles/${id}`);
}

// ---------------------------------------------------------------------------
// Individuals
// ---------------------------------------------------------------------------

export async function createIndividual(formData: FormData) {
  await requireAdmin();
  await db.insert(individuals).values({
    name: reqTxt(formData.get("name"), "Name"),
    rank: txt(formData.get("rank")),
    specialisation: txt(formData.get("specialisation")),
    employeeId: txt(formData.get("employeeId")),
    email: txt(formData.get("email")),
    isExternal: bool(formData.get("isExternal")),
  });
  fanoutPaths();
}

export async function updateIndividual(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) throw new Error("id is required");

  await db
    .update(individuals)
    .set({
      name: reqTxt(formData.get("name"), "Name"),
      rank: txt(formData.get("rank")),
      specialisation: txt(formData.get("specialisation")),
      employeeId: txt(formData.get("employeeId")),
      email: txt(formData.get("email")),
    })
    .where(eq(individuals.id, id));
  fanoutPaths(`/individuals/${id}`);
}

export async function deleteIndividual(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) return { ok: false, error: "id is required" };

  const [{ c }] = await db
    .select({ c: count() })
    .from(postings)
    .where(eq(postings.individualId, id));
  if (c > 0) {
    return {
      ok: false,
      error: `Can't delete this person — ${c} posting${c === 1 ? "" : "s"} reference them. Remove the postings on Admin → Postings first.`,
    };
  }

  await db.delete(individuals).where(eq(individuals.id, id));
  fanoutPaths();
  return { ok: true };
}
