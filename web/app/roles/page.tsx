export const dynamic = "force-dynamic";

import Link from "next/link";
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
    <div className="space-y-6">
      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Roles</div>
        <h1 className="text-2xl mt-1">Roles</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {roles.length} roles across {units.length} units. Click a role to see its
          incumbent history and queued candidates.
        </p>
      </header>

      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--raid-blue-deep)] text-white">
              <Th>Role</Th>
              <Th>Unit</Th>
              <Th>Level</Th>
              <Th>Current incumbent</Th>
              <Th align="right">Planned</Th>
              <Th align="right">Candidates</Th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r, idx) => {
              const unit = unitById.get(r.unitId);
              const inc = incumbents.get(r.id);
              return (
                <tr
                  key={r.id}
                  className={`border-t border-black/[0.06] hover:bg-[#f5f8fc] transition ${
                    idx % 2 === 1 ? "bg-black/[0.015]" : ""
                  }`}
                >
                  <Td>
                    <Link
                      href={`/roles/${r.id}`}
                      className="font-medium hover:underline text-[var(--raid-blue-deep)]"
                    >
                      {r.title}
                    </Link>
                    {r.isVacant && (
                      <span
                        className="ml-2 overline"
                        style={{ color: "var(--raid-coral)" }}
                      >
                        Vacant
                      </span>
                    )}
                  </Td>
                  <Td muted>{unit?.name}</Td>
                  <Td muted>
                    <span className="chrome-mono">{r.level}</span>
                  </Td>
                  <Td>
                    {inc ? (
                      <Link
                        href={`/individuals/${inc.id}`}
                        className="hover:underline"
                      >
                        {inc.name}
                      </Link>
                    ) : (
                      <span className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                        Unfilled
                      </span>
                    )}
                  </Td>
                  <Td align="right">
                    <span className="chrome-mono tabular-nums">
                      {plannedCounts.get(r.id) ?? 0}
                    </span>
                  </Td>
                  <Td align="right">
                    <span className="chrome-mono tabular-nums">
                      {candidateCounts.get(r.id) ?? 0}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={`px-4 py-2.5 chrome-mono text-white/85 text-[11px] font-medium tracking-wider ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  muted,
}: {
  children: React.ReactNode;
  align?: "right";
  muted?: boolean;
}) {
  return (
    <td
      className={`px-4 py-2.5 ${align === "right" ? "text-right" : ""} ${
        muted ? "text-[var(--muted-foreground)]" : ""
      }`}
    >
      {children}
    </td>
  );
}
