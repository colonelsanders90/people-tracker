"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, postings, roles } from "@/lib/db";
import type { PostingStatus } from "@/lib/db/schema";

const VALID_STATUSES: PostingStatus[] = [
  "Past",
  "Current",
  "Planned",
  "Candidate",
];

function parseTextField(value: FormDataEntryValue | null): string | null {
  const v = typeof value === "string" ? value.trim() : "";
  return v === "" ? null : v;
}

function parseStatus(value: FormDataEntryValue | null): PostingStatus {
  const v = typeof value === "string" ? value : "";
  if (!VALID_STATUSES.includes(v as PostingStatus)) {
    throw new Error(`Invalid status: ${v}`);
  }
  return v as PostingStatus;
}

export async function createPosting(formData: FormData) {
  const individualId = Number(formData.get("individualId"));
  const roleId = Number(formData.get("roleId"));
  const status = parseStatus(formData.get("status"));
  const startDate = parseTextField(formData.get("startDate"));
  const endDate = parseTextField(formData.get("endDate"));
  const notes = parseTextField(formData.get("notes"));

  if (!Number.isFinite(individualId) || !Number.isFinite(roleId)) {
    throw new Error("individualId and roleId are required");
  }

  await db.insert(postings).values({
    individualId,
    roleId,
    status,
    startDate,
    endDate,
    notes,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/org");
  revalidatePath(`/individuals/${individualId}`);
  revalidatePath(`/roles/${roleId}`);
}

export async function deletePosting(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("id is required");

  const existing = await db
    .select()
    .from(postings)
    .where(eq(postings.id, id))
    .limit(1);
  const row = existing[0];

  await db.delete(postings).where(eq(postings.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/org");
  if (row) {
    revalidatePath(`/individuals/${row.individualId}`);
    revalidatePath(`/roles/${row.roleId}`);
  }
}

export async function toggleRoleVacancy(formData: FormData) {
  const id = Number(formData.get("id"));
  const isVacant = formData.get("isVacant") === "true";
  if (!Number.isFinite(id)) throw new Error("id is required");

  await db.update(roles).set({ isVacant: !isVacant }).where(eq(roles.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/org");
  revalidatePath(`/roles/${id}`);
  revalidatePath("/roles");
}
