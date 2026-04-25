import type { Unit, Role } from "./db/schema";

export type UnitNode = Unit & {
  children: UnitNode[];
  roles: Role[];
};

export function buildUnitTree(units: Unit[], roles: Role[]): UnitNode[] {
  const byId = new Map<number, UnitNode>();
  for (const u of units) {
    byId.set(u.id, { ...u, children: [], roles: [] });
  }
  for (const r of roles) {
    // External roles (unitId === null) don't belong to the internal tree.
    if (r.unitId == null) continue;
    byId.get(r.unitId)?.roles.push(r);
  }
  const roots: UnitNode[] = [];
  for (const node of byId.values()) {
    if (node.parentUnitId == null) {
      roots.push(node);
    } else {
      byId.get(node.parentUnitId)?.children.push(node);
    }
  }
  return roots;
}
