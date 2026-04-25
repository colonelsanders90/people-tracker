import { eq, asc, and, inArray } from "drizzle-orm";
import { db, units, roles, individuals, postings } from "./db";
import type { Individual, Posting, Role, Unit } from "./db/schema";

/**
 * For external roles, role.unit is null and role.externalUnit holds the
 * sub-unit text (e.g. "DPLD"). Use `roleUnitLabel()` for display.
 */
export type RoleWithUnit = Role & { unit: Unit | null };

export type PostingWithRelations = Posting & {
  role: RoleWithUnit;
  individual: Individual;
};

/** Display label for a role's unit — internal unit name or external text. */
export function roleUnitLabel(role: RoleWithUnit): string {
  if (role.unit) return role.unit.name;
  return role.externalUnit ?? "External";
}

export async function getAllUnits(): Promise<Unit[]> {
  return db.select().from(units).orderBy(asc(units.level), asc(units.name));
}

export async function getAllRoles(): Promise<Role[]> {
  return db.select().from(roles).orderBy(asc(roles.level), asc(roles.title));
}

export async function getAllIndividuals(): Promise<Individual[]> {
  return db.select().from(individuals).orderBy(asc(individuals.name));
}

export async function getIndividual(id: number): Promise<Individual | null> {
  const rows = await db
    .select()
    .from(individuals)
    .where(eq(individuals.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getRole(id: number): Promise<RoleWithUnit | null> {
  const rows = await db
    .select()
    .from(roles)
    .leftJoin(units, eq(roles.unitId, units.id))
    .where(eq(roles.id, id))
    .limit(1);
  if (!rows[0]) return null;
  return { ...rows[0].roles, unit: rows[0].units };
}

export async function getPostingsForIndividual(
  individualId: number,
): Promise<PostingWithRelations[]> {
  const rows = await db
    .select()
    .from(postings)
    .innerJoin(roles, eq(postings.roleId, roles.id))
    .leftJoin(units, eq(roles.unitId, units.id))
    .innerJoin(individuals, eq(postings.individualId, individuals.id))
    .where(eq(postings.individualId, individualId))
    .orderBy(asc(postings.startDate));
  return rows.map((r) => ({
    ...r.postings,
    role: { ...r.roles, unit: r.units },
    individual: r.individuals,
  }));
}

export async function getPostingsForRole(
  roleId: number,
): Promise<PostingWithRelations[]> {
  const rows = await db
    .select()
    .from(postings)
    .innerJoin(roles, eq(postings.roleId, roles.id))
    .leftJoin(units, eq(roles.unitId, units.id))
    .innerJoin(individuals, eq(postings.individualId, individuals.id))
    .where(eq(postings.roleId, roleId))
    .orderBy(asc(postings.startDate));
  return rows.map((r) => ({
    ...r.postings,
    role: { ...r.roles, unit: r.units },
    individual: r.individuals,
  }));
}

export async function getAllPostings(): Promise<PostingWithRelations[]> {
  const rows = await db
    .select()
    .from(postings)
    .innerJoin(roles, eq(postings.roleId, roles.id))
    .leftJoin(units, eq(roles.unitId, units.id))
    .innerJoin(individuals, eq(postings.individualId, individuals.id))
    .orderBy(asc(postings.startDate));
  return rows.map((r) => ({
    ...r.postings,
    role: { ...r.roles, unit: r.units },
    individual: r.individuals,
  }));
}

export async function getCurrentIncumbent(
  roleId: number,
): Promise<Individual | null> {
  const rows = await db
    .select()
    .from(postings)
    .innerJoin(individuals, eq(postings.individualId, individuals.id))
    .where(and(eq(postings.roleId, roleId), eq(postings.status, "Current")))
    .limit(1);
  return rows[0]?.individuals ?? null;
}

export async function getCurrentIncumbentsByRole(
  roleIds: number[],
): Promise<Map<number, Individual>> {
  if (roleIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(postings)
    .innerJoin(individuals, eq(postings.individualId, individuals.id))
    .where(
      and(inArray(postings.roleId, roleIds), eq(postings.status, "Current")),
    );
  const map = new Map<number, Individual>();
  for (const r of rows) {
    map.set(r.postings.roleId, r.individuals);
  }
  return map;
}
