"use client";

import { useMemo, useState } from "react";

type SortDir = "asc" | "desc";
type SortValue = string | number | null | undefined;

export type Column<T> = {
  /** Stable identifier; used as the React key for the column. */
  key: string;
  header: React.ReactNode;
  align?: "left" | "right";
  /** Sort accessor — provide to make the column sortable. */
  sort?: (row: T) => SortValue;
  /** Cell renderer. */
  cell: (row: T) => React.ReactNode;
  width?: string;
};

export function SortableTable<T>({
  columns,
  rows,
  rowKey,
  initialSort,
  emptyState,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => React.Key;
  initialSort?: { key: string; dir: SortDir };
  emptyState?: React.ReactNode;
}) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | undefined>(
    initialSort,
  );

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col || !col.sort) return rows;
    const acc = col.sort;
    const dir = sort.dir;
    return [...rows].sort((a, b) => {
      const cmp = compare(acc(a), acc(b));
      return dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  function toggle(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-[var(--raid-blue-deep)] text-white">
          {columns.map((c) => {
            const active = sort?.key === c.key;
            const sortable = !!c.sort;
            return (
              <th
                key={c.key}
                className={`px-4 py-2.5 chrome-mono text-white/85 text-[11px] font-medium tracking-wider select-none ${
                  c.align === "right" ? "text-right" : "text-left"
                } ${sortable ? "cursor-pointer hover:bg-black/10" : ""}`}
                style={c.width ? { width: c.width } : undefined}
                onClick={sortable ? () => toggle(c.key) : undefined}
                aria-sort={
                  active
                    ? sort?.dir === "asc"
                      ? "ascending"
                      : "descending"
                    : sortable
                      ? "none"
                      : undefined
                }
              >
                <span
                  className={`inline-flex items-center gap-1 ${
                    c.align === "right" ? "flex-row-reverse" : ""
                  }`}
                >
                  <span>{c.header}</span>
                  {sortable && (
                    <span
                      aria-hidden
                      className={active ? "text-white" : "text-white/40"}
                    >
                      {active ? (sort!.dir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  )}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-10 text-center text-[var(--muted-foreground)] text-sm"
            >
              {emptyState ?? "No rows."}
            </td>
          </tr>
        ) : (
          sorted.map((row, idx) => (
            <tr
              key={rowKey(row)}
              className={`border-t border-black/[0.06] hover:bg-[#f5f8fc] transition ${
                idx % 2 === 1 ? "bg-black/[0.015]" : ""
              }`}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-2.5 align-top ${
                    c.align === "right" ? "text-right" : ""
                  }`}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function compare(a: SortValue, b: SortValue): number {
  // Nulls/undefined sort to the end ("asc" puts blanks last)
  const aMissing = a == null || a === "";
  const bMissing = b == null || b === "";
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}
