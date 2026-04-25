export const dynamic = "force-dynamic";

import {
  getAllRoles,
  getAllUnits,
  getCurrentIncumbentsByRole,
  getAllPostings,
} from "@/lib/queries";
import { buildUnitTree, type UnitNode } from "@/lib/hierarchy";
import { RAiD } from "@/components/raid";
import { isAdmin } from "@/lib/auth";
import { EditableUnitCard } from "./editable-unit-card";
import { AddBranchButton } from "./add-branch";

export default async function OrgPage() {
  const [units, roles, postings, admin] = await Promise.all([
    getAllUnits(),
    getAllRoles(),
    getAllPostings(),
    isAdmin(),
  ]);
  const incumbents = await getCurrentIncumbentsByRole(roles.map((r) => r.id));
  const tree = buildUnitTree(units, roles);

  const pendingByRole = new Map<number, number>();
  for (const p of postings) {
    if (p.status === "Planned" || p.status === "Candidate") {
      pendingByRole.set(p.roleId, (pendingByRole.get(p.roleId) ?? 0) + 1);
    }
  }

  const root = tree[0];
  const otherRoots = tree.slice(1);

  return (
    <div className="space-y-8">
      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Organisation</div>
        <h1 className="text-3xl mt-1">
          <RAiD /> Org Structure
        </h1>
        <p className="text-[15px] text-[var(--muted-foreground)] mt-1 max-w-2xl">
          The whole tree at a glance. Click any role to see incumbents and who is
          queued to come in.
          {admin && " Branches and roles are editable inline."}
        </p>
      </header>

      <Legend />

      {root && (
        <UnitTreeView
          root={root}
          incumbents={incumbents}
          pendingByRole={pendingByRole}
          isAdmin={admin}
        />
      )}

      {otherRoots.map((r) => (
        <UnitTreeView
          key={r.id}
          root={r}
          incumbents={incumbents}
          pendingByRole={pendingByRole}
          isAdmin={admin}
        />
      ))}

      {admin && root && (
        <div className="pt-4">
          <AddBranchButton parentUnitId={root.id} />
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 chrome-mono text-[var(--muted-foreground)]">
      <span className="overline">Legend</span>
      <LegendDot color="var(--raid-blue-deep)" label="Head" />
      <LegendDot color="var(--raid-blue)" label="Filled" />
      <LegendDot color="var(--raid-coral)" label="Vacant" />
      <LegendDot color="#B4B2A9" label="Unfilled" />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function UnitTreeView({
  root,
  incumbents,
  pendingByRole,
  isAdmin,
}: {
  root: UnitNode;
  incumbents: Map<number, import("@/lib/db/schema").Individual>;
  pendingByRole: Map<number, number>;
  isAdmin: boolean;
}) {
  const children = root.children;

  return (
    <div className="relative">
      <div className="flex justify-center">
        <EditableUnitCard
          unit={root}
          roles={root.roles}
          incumbents={incumbents}
          pendingByRole={pendingByRole}
          tone="L1"
          maxWidth={420}
          isAdmin={isAdmin}
        />
      </div>

      {children.length > 0 && (
        <div className="relative h-10 my-2">
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 40"
          >
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="14"
              stroke="var(--raid-blue)"
              strokeWidth="0.4"
            />
            <line
              x1={50 - 50 / Math.max(children.length, 1) + 50 / Math.max(children.length, 1) / 2}
              y1="14"
              x2={50 + 50 / Math.max(children.length, 1) - 50 / Math.max(children.length, 1) / 2}
              y2="14"
              stroke="var(--raid-blue)"
              strokeWidth="0.4"
            />
            {children.map((_, i) => {
              const cx = ((i + 0.5) / children.length) * 100;
              return (
                <line
                  key={i}
                  x1={cx}
                  y1="14"
                  x2={cx}
                  y2="40"
                  stroke="var(--raid-blue)"
                  strokeWidth="0.4"
                />
              );
            })}
          </svg>
        </div>
      )}

      {children.length > 0 && (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${children.length}, minmax(220px, 1fr))`,
          }}
        >
          {children.map((child) => (
            <EditableUnitCard
              key={child.id}
              unit={child}
              roles={child.roles}
              incumbents={incumbents}
              pendingByRole={pendingByRole}
              tone="L2"
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
