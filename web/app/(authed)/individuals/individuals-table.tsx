"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { SortableTable, type Column } from "@/components/sortable-table";

type FuturePosting = {
  id: number;
  status: "Past" | "Current" | "Planned" | "Candidate";
  startDate: string | null;
  roleId: number;
  roleTitle: string;
  unitName: string;
};

export type IndividualRow = {
  id: number;
  name: string;
  isExternal: boolean;
  current: { roleId: number; roleTitle: string; unitName: string } | null;
  future: FuturePosting[];
};

export function IndividualsTable({ rows }: { rows: IndividualRow[] }) {
  const columns: Column<IndividualRow>[] = [
    {
      key: "name",
      header: "Name",
      sort: (r) => r.name.toLowerCase(),
      cell: (r) => (
        <span>
          <Link
            href={`/individuals/${r.id}`}
            className="font-medium hover:underline text-[var(--raid-blue-deep)]"
          >
            {r.name}
          </Link>
          {r.isExternal && (
            <span className="ml-2 chrome-mono text-[10px] text-[var(--muted-foreground)]">
              external
            </span>
          )}
        </span>
      ),
    },
    {
      key: "current",
      header: "Current role",
      sort: (r) => r.current?.roleTitle?.toLowerCase() ?? null,
      cell: (r) =>
        r.current ? (
          <Link
            href={`/roles/${r.current.roleId}`}
            className="hover:underline"
          >
            {r.current.roleTitle}{" "}
            <span className="text-[var(--muted-foreground)]">
              · {r.current.unitName}
            </span>
          </Link>
        ) : (
          <span className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
            None
          </span>
        ),
    },
    {
      key: "future",
      header: "Possible next roles",
      sort: (r) => r.future.length,
      cell: (r) =>
        r.future.length === 0 ? (
          <span className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
            —
          </span>
        ) : (
          <ul className="space-y-1">
            {r.future.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 leading-snug"
              >
                <StatusBadge status={p.status} />
                <Link
                  href={`/roles/${p.roleId}`}
                  className="hover:underline"
                >
                  {p.roleTitle}
                  <span className="text-[var(--muted-foreground)]">
                    {" "}
                    · {p.unitName}
                  </span>
                </Link>
                {p.startDate && (
                  <span className="chrome-mono text-[10px] text-[var(--muted-foreground)]">
                    {p.startDate}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ),
    },
  ];

  return (
    <div className="surface-card overflow-hidden">
      <SortableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        initialSort={{ key: "name", dir: "asc" }}
      />
    </div>
  );
}
