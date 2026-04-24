import type { Individual, Role, Unit } from "./db/schema";
import {
  units as mockUnits,
  roles as mockRoles,
  individuals as mockIndividuals,
  postingsWithRelations,
} from "./mock-data";

export type PostingWithRelations = import("./db/schema").Posting & {
  role: Role & { unit: Unit };
  individual: Individual;
};

export async function getAllUnits(): Promise<Unit[]> {
  return [...mockUnits].sort((a, b) => a.level.localeCompare(b.level) || a.name.localeCompare(b.name));
}

export async function getAllRoles(): Promise<Role[]> {
  return [...mockRoles].sort((a, b) => a.level.localeCompare(b.level) || a.title.localeCompare(b.title));
}

export async function getAllIndividuals(): Promise<Individual[]> {
  return [...mockIndividuals].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllPostings(): Promise<PostingWithRelations[]> {
  return [...postingsWithRelations].sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
}

export async function getIndividual(id: number): Promise<Individual | null> {
  return mockIndividuals.find((i) => i.id === id) ?? null;
}

export async function getRole(id: number): Promise<(Role & { unit: Unit }) | null> {
  const role = mockRoles.find((r) => r.id === id);
  if (!role) return null;
  const unit = mockUnits.find((u) => u.id === role.unitId)!;
  return { ...role, unit };
}

export async function getPostingsForIndividual(individualId: number): Promise<PostingWithRelations[]> {
  return postingsWithRelations
    .filter((p) => p.individualId === individualId)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
}

export async function getPostingsForRole(roleId: number): Promise<PostingWithRelations[]> {
  return postingsWithRelations
    .filter((p) => p.roleId === roleId)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
}

export async function getCurrentIncumbent(roleId: number): Promise<Individual | null> {
  return postingsWithRelations.find((p) => p.roleId === roleId && p.status === "Current")?.individual ?? null;
}

export async function getCurrentIncumbentsByRole(roleIds: number[]): Promise<Map<number, Individual>> {
  const map = new Map<number, Individual>();
  for (const p of postingsWithRelations) {
    if (p.status === "Current" && roleIds.includes(p.roleId)) {
      map.set(p.roleId, p.individual);
    }
  }
  return map;
}
