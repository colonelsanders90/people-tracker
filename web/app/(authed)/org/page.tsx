export const dynamic = "force-dynamic";

import {
  getAllRoles,
  getAllUnits,
  getCurrentIncumbentsByRole,
  getAllPostings,
  getAllIndividuals,
} from "@/lib/queries";
import { buildUnitTree, type UnitNode } from "@/lib/hierarchy";
import { RAiD } from "@/components/raid";
import { isAdmin } from "@/lib/auth";
import { EditableUnitCard } from "./editable-unit-card";
import { AddBranchButton } from "./add-branch";

export default async function OrgPage() {
  const [units, roles, postings, individuals, admin] = await Promise.all([
    getAllUnits(),
    getAllRoles(),
    getAllPostings(),
    getAllIndividuals(),
    isAdmin(),
  ]);
  const incumbents = await getCurrentIncumbentsByRole(roles.map((r) => r.id));
  const tree = buildUnitTree(units, roles);

  const individualOptions = individuals.map((i) => ({
    id: i.id,
    name: i.name,
    rank: i.rank,
    isExternal: i.isExternal,
  }));

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
          {admin && (
            <span>
              {" "}
              Edit branches and roles inline — hover any card for{" "}
              <code className="chrome-mono text-[12px] bg-black/[0.04] px-1 rounded">
                edit
              </code>{" "}
              /{" "}
              <code className="chrome-mono text-[12px] bg-black/[0.04] px-1 rounded">
                ×
              </code>{" "}
              controls.
            </span>
          )}
        </p>
      </header>

      <Legend />

      {root && (
        <UnitTreeView
          root={root}
          incumbents={incumbents}
          pendingByRole={pendingByRole}
          isAdmin={admin}
          individuals={individualOptions}
        />
      )}

      {otherRoots.map((r) => (
        <UnitTreeView
          key={r.id}
          root={r}
          incumbents={incumbents}
          pendingByRole={pendingByRole}
          isAdmin={admin}
          individuals={individualOptions}
        />
      ))}

      {admin && root && (
        <div className="pt-2">
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
  individuals,
}: {
  root: UnitNode;
  incumbents: Map<number, import("@/lib/db/schema").Individual>;
  pendingByRole: Map<number, number>;
  isAdmin: boolean;
  individuals: {
    id: number;
    name: string;
    rank: string | null;
    isExternal: boolean;
  }[];
}) {
  const children = root.children;

  return (
    <div className="space-y-4">
      {/* L1 root, centred */}
      <div className="flex justify-center">
        <EditableUnitCard
          unit={root}
          roles={root.roles}
          incumbents={incumbents}
          pendingByRole={pendingByRole}
          tone="L1"
          maxWidth={420}
          isAdmin={isAdmin}
          individuals={individuals}
        />
      </div>

      {/* L2 branches — wrapping auto-fill grid, consistent card width */}
      {children.length > 0 && (
        <div>
          <div className="text-center mb-3">
            <span className="overline text-[var(--muted-foreground)]">
              {children.length} branch{children.length === 1 ? "" : "es"}
            </span>
            <div
              className="mx-auto w-px h-4 bg-[var(--raid-blue)]/30 mt-1"
              aria-hidden
            />
          </div>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
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
                individuals={individuals}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
