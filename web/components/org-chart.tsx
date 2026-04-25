import Link from "next/link";
import type { UnitNode } from "@/lib/hierarchy";
import type { Individual } from "@/lib/db/schema";

type Props = {
  tree: UnitNode[];
  incumbents: Map<number, Individual>;
  highlightRoleId?: number;
  highlightUnitId?: number;
};

/**
 * Compact, sidebar-friendly nested org chart.
 * For the flagship full-page version, see /app/org/page.tsx.
 */
export function OrgChart({
  tree,
  incumbents,
  highlightRoleId,
  highlightUnitId,
}: Props) {
  return (
    <div className="space-y-3">
      {tree.map((node) => (
        <UnitBlock
          key={node.id}
          node={node}
          incumbents={incumbents}
          highlightRoleId={highlightRoleId}
          highlightUnitId={highlightUnitId}
        />
      ))}
    </div>
  );
}

function UnitBlock({
  node,
  incumbents,
  highlightRoleId,
  highlightUnitId,
}: {
  node: UnitNode;
  incumbents: Map<number, Individual>;
  highlightRoleId?: number;
  highlightUnitId?: number;
}) {
  const head = node.roles.find((r) => r.isHead);
  const staff = node.roles.filter((r) => !r.isHead);
  const unitHighlighted = highlightUnitId === node.id;

  const levelStyles: Record<string, string> = {
    L1: "border-[var(--raid-blue-deep)]/30 bg-[#F4F7FC]",
    L2: "border-[var(--raid-blue)]/25 bg-white",
    L3: "border-black/10 bg-white",
  };

  return (
    <div
      className={`rounded-[10px] border p-3 ${levelStyles[node.level]} ${
        unitHighlighted ? "outline outline-2 outline-[var(--raid-blue)]" : ""
      }`}
    >
      <div className="flex items-baseline gap-2">
        <span className="overline">{node.level}</span>
        <h3 className="font-semibold text-[13px] leading-tight">{node.name}</h3>
        {node.code && (
          <span className="ml-auto chrome-mono text-[10px] text-[var(--muted-foreground)]">
            {node.code}
          </span>
        )}
      </div>

      {head && (
        <div className="mt-2">
          <RoleRow
            role={head}
            incumbent={incumbents.get(head.id)}
            highlighted={highlightRoleId === head.id}
            isHead
          />
        </div>
      )}

      {staff.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {staff.map((r) => (
            <li key={r.id}>
              <RoleRow
                role={r}
                incumbent={incumbents.get(r.id)}
                highlighted={highlightRoleId === r.id}
              />
            </li>
          ))}
        </ul>
      )}

      {node.children.length > 0 && (
        <div className="mt-3 ml-3 pl-3 border-l border-[var(--raid-blue)]/20 space-y-2">
          {node.children.map((child) => (
            <UnitBlock
              key={child.id}
              node={child}
              incumbents={incumbents}
              highlightRoleId={highlightRoleId}
              highlightUnitId={highlightUnitId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoleRow({
  role,
  incumbent,
  highlighted,
  isHead,
}: {
  role: { id: number; title: string; isVacant: boolean };
  incumbent: Individual | undefined;
  highlighted: boolean;
  isHead?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-xs px-2 py-1 rounded-md ${
        highlighted
          ? "bg-[var(--raid-blue-light)]/30 ring-1 ring-[var(--raid-blue)]"
          : isHead
            ? "bg-[var(--raid-blue-deep)]/[0.04]"
            : "bg-black/[0.02]"
      }`}
    >
      <Link
        href={`/roles/${role.id}`}
        className={`hover:underline ${isHead ? "font-semibold text-[var(--raid-blue-deep)]" : ""}`}
      >
        {role.title}
      </Link>
      {role.isVacant && (
        <span className="overline" style={{ color: "var(--raid-coral)" }}>
          Vacant
        </span>
      )}
      <span className="ml-auto truncate text-[var(--muted-foreground)]">
        {incumbent ? (
          <Link
            href={`/individuals/${incumbent.id}`}
            className="hover:underline"
          >
            {incumbent.name}
          </Link>
        ) : (
          <span className="font-mono-brand text-[10px] uppercase tracking-wider opacity-70">
            Unfilled
          </span>
        )}
      </span>
    </div>
  );
}
