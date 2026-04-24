export const dynamic = "force-dynamic";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllRoles,
  getAllUnits,
  getAllPostings,
  getCurrentIncumbentsByRole,
} from "@/lib/queries";

export default async function RolesPage() {
  const [roles, units, postings] = await Promise.all([
    getAllRoles(),
    getAllUnits(),
    getAllPostings(),
  ]);
  const incumbents = await getCurrentIncumbentsByRole(roles.map((r) => r.id));

  const unitById = new Map(units.map((u) => [u.id, u]));

  const candidateCounts = new Map<number, number>();
  const plannedCounts = new Map<number, number>();
  for (const p of postings) {
    if (p.status === "Candidate") {
      candidateCounts.set(p.roleId, (candidateCounts.get(p.roleId) ?? 0) + 1);
    } else if (p.status === "Planned") {
      plannedCounts.set(p.roleId, (plannedCounts.get(p.roleId) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Roles</h1>
        <p className="text-sm text-muted-foreground">
          {roles.length} roles across {units.length} units. Click a role to see
          its incumbent history and candidates.
        </p>
      </header>

      <div className="border rounded-lg bg-white dark:bg-neutral-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Current incumbent</TableHead>
              <TableHead className="text-right">Planned</TableHead>
              <TableHead className="text-right">Candidates</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((r) => {
              const unit = unitById.get(r.unitId);
              const inc = incumbents.get(r.id);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/roles/${r.id}`}
                      className="font-medium hover:underline"
                    >
                      {r.title}
                    </Link>
                    {r.isVacant && (
                      <Badge variant="destructive" className="ml-2 text-[10px]">
                        VACANT
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {unit?.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.level}
                  </TableCell>
                  <TableCell>
                    {inc ? (
                      <Link
                        href={`/individuals/${inc.id}`}
                        className="hover:underline"
                      >
                        {inc.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground italic">
                        unfilled
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {plannedCounts.get(r.id) ?? 0}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {candidateCounts.get(r.id) ?? 0}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
