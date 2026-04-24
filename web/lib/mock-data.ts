import type { Unit, Role, Individual, Posting } from "./db/schema";
import type { PostingWithRelations } from "./queries";

export const units: Unit[] = [
  { id: 1, name: "HQ RAiD", code: "HQ", level: "L1", parentUnitId: null, description: null, isActive: true, createdAt: new Date("2024-01-01") },
  { id: 2, name: "Alpha Squadron", code: "A SQN", level: "L2", parentUnitId: 1, description: null, isActive: true, createdAt: new Date("2024-01-01") },
  { id: 3, name: "Bravo Squadron", code: "B SQN", level: "L2", parentUnitId: 1, description: null, isActive: true, createdAt: new Date("2024-01-01") },
  { id: 4, name: "Support Element", code: "SPT ELT", level: "L2", parentUnitId: 1, description: null, isActive: true, createdAt: new Date("2024-01-01") },
];

export const roles: Role[] = [
  { id: 1, title: "Commanding Officer", unitId: 1, level: "L1", isHead: true, standardTenureMonths: 24, isVacant: false, specialisation: null, isActive: true, createdAt: new Date("2024-01-01") },
  { id: 2, title: "Operations Officer", unitId: 1, level: "L1", isHead: false, standardTenureMonths: 24, isVacant: false, specialisation: "Operations", isActive: true, createdAt: new Date("2024-01-01") },
  { id: 3, title: "OC Alpha", unitId: 2, level: "L2", isHead: true, standardTenureMonths: 18, isVacant: false, specialisation: null, isActive: true, createdAt: new Date("2024-01-01") },
  { id: 4, title: "Signals Operator", unitId: 2, level: "L2", isHead: false, standardTenureMonths: 12, isVacant: true, specialisation: "Signals", isActive: true, createdAt: new Date("2024-01-01") },
  { id: 5, title: "OC Bravo", unitId: 3, level: "L2", isHead: true, standardTenureMonths: 18, isVacant: false, specialisation: null, isActive: true, createdAt: new Date("2024-01-01") },
  { id: 6, title: "Intelligence Analyst", unitId: 3, level: "L3", isHead: false, standardTenureMonths: 24, isVacant: false, specialisation: "Intelligence", isActive: true, createdAt: new Date("2024-01-01") },
  { id: 7, title: "Logistics Officer", unitId: 4, level: "L2", isHead: true, standardTenureMonths: 24, isVacant: false, specialisation: "Logistics", isActive: true, createdAt: new Date("2024-01-01") },
];

export const individuals: Individual[] = [
  { id: 1, name: "LTC John Smith", employeeId: "S1001", rank: "LTC", specialisation: "Infantry", email: null, isActive: true, createdAt: new Date("2024-01-01") },
  { id: 2, name: "MAJ Sarah Chen", employeeId: "S1002", rank: "MAJ", specialisation: "Signals", email: null, isActive: true, createdAt: new Date("2024-01-01") },
  { id: 3, name: "CPT David Wong", employeeId: "S1003", rank: "CPT", specialisation: "Infantry", email: null, isActive: true, createdAt: new Date("2024-01-01") },
  { id: 4, name: "CPT Aisha Rahman", employeeId: "S1004", rank: "CPT", specialisation: "Intelligence", email: null, isActive: true, createdAt: new Date("2024-01-01") },
  { id: 5, name: "LTA James Tan", employeeId: "S1005", rank: "LTA", specialisation: "Signals", email: null, isActive: true, createdAt: new Date("2024-01-01") },
  { id: 6, name: "LTA Priya Nair", employeeId: "S1006", rank: "LTA", specialisation: "Logistics", email: null, isActive: true, createdAt: new Date("2024-01-01") },
];

const unitById = new Map(units.map((u) => [u.id, u]));
const roleById = new Map(roles.map((r) => [r.id, r]));
const individualById = new Map(individuals.map((i) => [i.id, i]));

const rawPostings: Posting[] = [
  { id: 1, individualId: 1, roleId: 1, status: "Current", startDate: "2024-01-01", endDate: null, notes: null, createdAt: new Date("2024-01-01") },
  { id: 2, individualId: 2, roleId: 2, status: "Current", startDate: "2023-06-01", endDate: null, notes: null, createdAt: new Date("2023-06-01") },
  { id: 3, individualId: 3, roleId: 3, status: "Current", startDate: "2024-03-01", endDate: null, notes: null, createdAt: new Date("2024-03-01") },
  { id: 4, individualId: 4, roleId: 5, status: "Current", startDate: "2024-01-15", endDate: null, notes: null, createdAt: new Date("2024-01-15") },
  { id: 5, individualId: 5, roleId: 6, status: "Current", startDate: "2023-12-01", endDate: null, notes: null, createdAt: new Date("2023-12-01") },
  { id: 6, individualId: 6, roleId: 7, status: "Current", startDate: "2024-02-01", endDate: null, notes: null, createdAt: new Date("2024-02-01") },
  { id: 7, individualId: 3, roleId: 1, status: "Planned", startDate: "2026-01-01", endDate: null, notes: "Earmarked to take over from LTC Smith", createdAt: new Date("2024-06-01") },
  { id: 8, individualId: 5, roleId: 4, status: "Candidate", startDate: null, endDate: null, notes: null, createdAt: new Date("2024-08-01") },
  { id: 9, individualId: 2, roleId: 4, status: "Candidate", startDate: null, endDate: null, notes: "Pending specialisation check", createdAt: new Date("2024-09-01") },
  { id: 10, individualId: 1, roleId: 2, status: "Past", startDate: "2021-01-01", endDate: "2023-12-31", notes: null, createdAt: new Date("2021-01-01") },
  { id: 11, individualId: 3, roleId: 3, status: "Past", startDate: "2022-06-01", endDate: "2024-02-28", notes: null, createdAt: new Date("2022-06-01") },
];

function toRelations(p: Posting): PostingWithRelations {
  const role = roleById.get(p.roleId)!;
  const unit = unitById.get(role.unitId)!;
  const individual = individualById.get(p.individualId)!;
  return { ...p, role: { ...role, unit }, individual };
}

export const postingsWithRelations: PostingWithRelations[] = rawPostings.map(toRelations);
