"use server";

import { revalidatePath } from "next/cache";
import { eq, count } from "drizzle-orm";
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
export async function createPosting(formData: FormData) {
  await requireAdmin();

  const externalIndividual = bool(formData.get("externalIndividual"));
  const externalRole = bool(formData.get("externalRole"));

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
    if (id == null) throw new Error("Individual is required");
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
    if (id == null) throw new Error("Role is required");
    roleId = id;
  }

  await db.insert(postings).values({
    individualId,
    roleId,
    status: status(formData.get("status")),
    startDate: txt(formData.get("startDate")),
    endDate: txt(formData.get("endDate")),
    notes: txt(formData.get("notes")),
  });

  fanoutPaths(`/individuals/${individualId}`, `/roles/${roleId}`);
}

export async function deletePosting(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) throw new Error("id is required");

  const existing = (
    await db.select().from(postings).where(eq(postings.id, id)).limit(1)
  )[0];

  await db.delete(postings).where(eq(postings.id, id));

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

export async function deleteUnit(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) throw new Error("id is required");

  // Safety: refuse if any roles still reference this unit
  const [{ c }] = await db
    .select({ c: count() })
    .from(roles)
    .where(eq(roles.unitId, id));
  if (c > 0) {
    throw new Error(
      `Cannot delete: ${c} role${c === 1 ? "" : "s"} still belong to this branch. Delete the roles first.`,
    );
  }

  await db.delete(units).where(eq(units.id, id));
  fanoutPaths();
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export async function createRole(formData: FormData) {
  await requireAdmin();
  const title = reqTxt(formData.get("title"), "Role title");
  const unitId = num(formData.get("unitId"));
  const lvl = level(formData.get("level"));
  const isHead = bool(formData.get("isHead"));
  const specialisation = txt(formData.get("specialisation"));

  if (unitId == null) throw new Error("unitId is required");

  await db.insert(roles).values({
    title,
    unitId,
    level: lvl,
    isHead,
    specialisation,
  });

  fanoutPaths();
}

export async function updateRole(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) throw new Error("id is required");

  await db
    .update(roles)
    .set({
      title: reqTxt(formData.get("title"), "Role title"),
      isHead: bool(formData.get("isHead")),
      specialisation: txt(formData.get("specialisation")),
    })
    .where(eq(roles.id, id));

  fanoutPaths(`/roles/${id}`);
}

export async function deleteRole(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) throw new Error("id is required");

  // Safety: refuse if any postings reference this role
  const [{ c }] = await db
    .select({ c: count() })
    .from(postings)
    .where(eq(postings.roleId, id));
  if (c > 0) {
    throw new Error(
      `Cannot delete: ${c} posting${c === 1 ? "" : "s"} reference this role. Delete the postings first.`,
    );
  }

  await db.delete(roles).where(eq(roles.id, id));
  fanoutPaths();
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

export async function deleteIndividual(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"));
  if (id == null) throw new Error("id is required");

  const [{ c }] = await db
    .select({ c: count() })
    .from(postings)
    .where(eq(postings.individualId, id));
  if (c > 0) {
    throw new Error(
      `Cannot delete: ${c} posting${c === 1 ? "" : "s"} reference this person. Delete the postings first.`,
    );
  }

  await db.delete(individuals).where(eq(individuals.id, id));
  fanoutPaths();
}
