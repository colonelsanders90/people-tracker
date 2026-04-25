export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  getAllRoles,
  getAllUnits,
  getCurrentIncumbentsByRole,
  getAllPostings,
} from "@/lib/queries";
import { buildUnitTree, type UnitNode } from "@/lib/hierarchy";
import { RAiD } from "@/components/raid";

/**
 * Flagship organisational structure view.
 * Renders L1 at the top, L2 children spread horizontally below, with SVG
 * connectors. L3 staff nest inside their L2 unit cards.
 */
export default async function OrgPage() {
  const [units, roles, postings] = await Promise.all([
    getAllUnits(),
    getAllRoles(),
    getAllPostings(),
  ]);
  const incumbents = await getCurrentIncumbentsByRole(roles.map((r) => r.id));
  const tree = buildUnitTree(units, roles);

  // Pending = planned + candidate, grouped by role.
  const pendingByRole = new Map<number, number>();
  for (const p of postings) {
    if (p.status === "Planned" || p.status === "Candidate") {
      pendingByRole.set(p.roleId, (pendingByRole.get(p.roleId) ?? 0) + 1);
    }
  }

  // Expect a single L1 root for RAiD; render gracefully if multiple.
  const root = tree[0];
  const otherRoots = tree.slice(1);

  return (
    <div className="space-y-8">
      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Organisation</div>
        <h1 className="text-3xl mt-1">
          <RAiD /> org structure
        </h1>
        <p className="text-[15px] text-[var(--muted-foreground)] mt-1 max-w-2xl">
          The whole tree at a glance. Click any role to see incumbents and who is queued
          to come in. Click any name to see their movement timeline.
        </p>
      </header>

      <Legend />

      {root && (
        <UnitTreeView
          root={root}
          incumbents={incumbents}
          pendingByRole={pendingByRole}
        />
      )}

      {otherRoots.map((r) => (
        <UnitTreeView
          key={r.id}
          root={r}
          incumbents={incumbents}
          pendingByRole={pendingByRole}
        />
      ))}
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
}: {
  root: UnitNode;
  incumbents: Map<number, import("@/lib/db/schema").Individual>;
  pendingByRole: Map<number, number>;
}) {
  const children = root.children;

  return (
    <div className="relative">
      {/* L1 card centered */}
      <div className="flex justify-center">
        <UnitCard
          unit={root}
          incumbents={incumbents}
          pendingByRole={pendingByRole}
          tone="L1"
          maxWidth={420}
        />
      </div>

      {/* SVG connectors from L1 down to each L2 child */}
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

      {/* L2 row */}
      {children.length > 0 && (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${children.length}, minmax(0, 1fr))`,
          }}
        >
          {children.map((child) => (
            <UnitCard
              key={child.id}
              unit={child}
              incumbents={incumbents}
              pendingByRole={pendingByRole}
              tone="L2"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UnitCard({
  unit,
  incumbents,
  pendingByRole,
  tone,
  maxWidth,
}: {
  unit: UnitNode;
  incumbents: Map<number, import("@/lib/db/schema").Individual>;
  pendingByRole: Map<number, number>;
  tone: "L1" | "L2";
  maxWidth?: number;
}) {
  const head = unit.roles.find((r) => r.isHead);
  const staff = unit.roles.filter((r) => !r.isHead);
  const filled = unit.roles.filter((r) => incumbents.has(r.id)).length;

  const headerBg =
    tone === "L1" ? "var(--raid-blue-deep)" : "var(--raid-blue)";

  return (
    <div
      className="surface-card overflow-hidden"
      style={{ maxWidth: maxWidth ? `${maxWidth}px` : undefined, width: "100%" }}
    >
      {/* Navy/blue header strip */}
      <div
        className="px-4 py-3 text-white flex items-baseline gap-2"
        style={{ background: headerBg }}
      >
        <span className="overline-on-dark">{unit.level}</span>
        <h3 className="font-semibold text-[15px] tracking-tight">{unit.name}</h3>
        {unit.code && (
          <span className="ml-auto chrome-mono text-white/65 text-[11px]">
            {unit.code}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {head && (
          <RoleCard
            role={head}
            incumbent={incumbents.get(head.id)}
            pending={pendingByRole.get(head.id) ?? 0}
            isHead
          />
        )}

        {staff.length > 0 && (
          <ul className="space-y-1.5">
            {staff.map((r) => (
              <li key={r.id}>
                <RoleCard
                  role={r}
                  incumbent={incumbents.get(r.id)}
                  pending={pendingByRole.get(r.id) ?? 0}
                />
              </li>
            ))}
          </ul>
        )}

        {unit.roles.length === 0 && (
          <p className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
            No roles defined
          </p>
        )}

        <div className="pt-2 border-t border-black/[0.06] flex items-center gap-2 chrome-mono text-[11px]">
          <span className="text-[var(--muted-foreground)]">Filled</span>
          <span className="tabular-nums font-semibold">
            {filled}/{unit.roles.length}
          </span>
          {unit.roles.some((r) => r.isVacant) && (
            <span className="ml-auto" style={{ color: "var(--raid-coral)" }}>
              ● Vacancy
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  role,
  incumbent,
  pending,
  isHead,
}: {
  role: { id: number; title: string; isVacant: boolean };
  incumbent: import("@/lib/db/schema").Individual | undefined;
  pending: number;
  isHead?: boolean;
}) {
  return (
    <div
      className={`rounded-md px-3 py-2 ${
        isHead ? "bg-[var(--raid-blue-deep)]/[0.04]" : "bg-black/[0.02]"
      }`}
    >
      <div className="flex items-baseline gap-2">
        <Link
          href={`/roles/${role.id}`}
          className={`hover:underline text-[13px] ${
            isHead
              ? "font-semibold text-[var(--raid-blue-deep)]"
              : "font-medium"
          }`}
        >
          {role.title}
        </Link>
        {role.isVacant && (
          <span className="overline" style={{ color: "var(--raid-coral)" }}>
            Vacant
          </span>
        )}
        {pending > 0 && (
          <span
            className="ml-auto chrome-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: "var(--raid-status-blue-bg)",
              color: "var(--raid-status-blue-text)",
            }}
            title="Planned + Candidate postings"
          >
            +{pending} pending
          </span>
        )}
      </div>
      <div className="mt-1 text-[12.5px]">
        {incumbent ? (
          <Link
            href={`/individuals/${incumbent.id}`}
            className="hover:underline text-[var(--foreground)]"
          >
            {incumbent.name}
            {incumbent.rank && (
              <span className="text-[var(--muted-foreground)]">
                {" "}
                · {incumbent.rank}
              </span>
            )}
          </Link>
        ) : (
          <span className="font-mono-brand text-[10.5px] uppercase tracking-wider text-[var(--muted-foreground)]">
            Unfilled
          </span>
        )}
      </div>
    </div>
  );
}
