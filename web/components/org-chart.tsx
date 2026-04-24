import Link from "next/link";
import type { UnitNode } from "@/lib/hierarchy";
import type { Individual } from "@/lib/db/schema";

type Props = {
  tree: UnitNode[];
  incumbents: Map<number, Individual>;
  highlightRoleId?: number;
  highlightUnitId?: number;
};

export function OrgChart({
  tree,
  incumbents,
  highlightRoleId,
  highlightUnitId,
}: Props) {
  return (
    <div className="space-y-4">
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
  const levelBg: Record<string, string> = {
    L1: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900",
    L2: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900",
    L3: "bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800",
  };

  const head = node.roles.find((r) => r.isHead);
  const staff = node.roles.filter((r) => !r.isHead);
  const unitHighlighted = highlightUnitId === node.id;

  return (
    <div
      className={`border rounded-lg p-3 ${levelBg[node.level]} ${
        unitHighlighted ? "ring-2 ring-yellow-400" : ""
      }`}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/30 text-muted-foreground">
          {node.level}
        </span>
        <h3 className="font-semibold text-sm">{node.name}</h3>
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
        <ul className="mt-2 space-y-1">
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
        <div className="mt-3 ml-4 pl-3 border-l-2 border-neutral-300 dark:border-neutral-700 space-y-3">
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
      className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
        highlighted
          ? "bg-yellow-100 dark:bg-yellow-900/40 ring-1 ring-yellow-400"
          : "bg-white/70 dark:bg-black/20"
      }`}
    >
      <Link
        href={`/roles/${role.id}`}
        className={`hover:underline ${isHead ? "font-semibold" : ""}`}
      >
        {role.title}
      </Link>
      {role.isVacant && (
        <span className="text-[10px] uppercase tracking-wide text-red-600 dark:text-red-400">
          vacant
        </span>
      )}
      <span className="ml-auto text-muted-foreground truncate">
        {incumbent ? (
          <Link
            href={`/individuals/${incumbent.id}`}
            className="hover:underline"
          >
            {incumbent.name}
          </Link>
        ) : (
          <span className="italic">— unfilled</span>
        )}
      </span>
    </div>
  );
}
