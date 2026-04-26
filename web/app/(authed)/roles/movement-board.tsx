"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { SortableTable, type Column } from "@/components/sortable-table";

type IncomingPosting = {
  id: number;
  status: "Planned" | "Candidate";
  individualId: number;
  individualName: string;
  startDate: string | null;
};

type CurrentPosting = {
  id: number;
  individualId: number;
  individualName: string;
  rank: string | null;
  endDate: string | null;
};

export type RoleMovementRow = {
  id: number;
  title: string;
  level: "L1" | "L2" | "L3";
  unitId: number | null;
  unitName: string;
  isVacant: boolean;
  isHead: boolean;
  establishmentRank: string | null;
  establishmentVocation: string | null;
  current: CurrentPosting | null;
  /** sorted ascending by startDate (earliest first), nulls last */
  incoming: IncomingPosting[];
  /** ms since epoch for the next change event (out date or in date), null if no event */
  nextEventAt: number | null;
  /** "vacant" | "ending-soon" | "incoming" | "stable" — derived */
  signal: "vacant" | "ending-soon" | "incoming" | "stable";
};

type FilterKey =
  | "movement"
  | "vacancies"
  | "ending-soon"
  | "incoming"
  | "all";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "movement", label: "All movement" },
  { key: "vacancies", label: "Vacancies" },
  { key: "ending-soon", label: "Ending soon" },
  { key: "incoming", label: "Has incoming" },
  { key: "all", label: "All roles" },
];

function formatEstablishment(
  rank: string | null,
  vocation: string | null,
): string | null {
  if (!rank && !vocation) return null;
  if (rank && vocation) return `${rank}/${vocation}`;
  return rank ?? vocation;
}

function matchesFilter(row: RoleMovementRow, filter: FilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "movement":
      return row.signal !== "stable";
    case "vacancies":
      return row.isVacant || row.signal === "vacant";
    case "ending-soon":
      return row.signal === "ending-soon";
    case "incoming":
      return row.incoming.length > 0;
  }
}

const signalRank: Record<RoleMovementRow["signal"], number> = {
  vacant: 0,
  "ending-soon": 1,
  incoming: 2,
  stable: 3,
};

export function MovementBoard({
  rows,
  totals,
}: {
  rows: RoleMovementRow[];
  totals: {
    all: number;
    vacant: number;
    endingSoon: number;
    incoming: number;
  };
}) {
  const [filter, setFilter] = useState<FilterKey>("movement");

  const filteredRows = useMemo(
    () => rows.filter((r) => matchesFilter(r, filter)),
    [rows, filter],
  );

  const columns: Column<RoleMovementRow>[] = [
    {
      key: "title",
      header: "Role",
      sort: (r) => r.title.toLowerCase(),
      cell: (r) => {
        const est = formatEstablishment(
          r.establishmentRank,
          r.establishmentVocation,
        );
        return (
          <span className="inline-flex items-baseline gap-2 flex-wrap">
            <Link
              href={`/roles/${r.id}`}
              className="font-medium hover:underline text-[var(--raid-blue-deep)]"
            >
              {r.title}
            </Link>
            <span className="chrome-mono text-[10px] text-[var(--muted-foreground)]">
              {r.level}
            </span>
            {est && (
              <span
                className="chrome-mono text-[10px] px-1.5 py-0.5 rounded bg-black/[0.05] text-[var(--muted-foreground)]"
                title="Establishment — Rank/Vocation"
              >
                {est}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "unit",
      header: "Branch",
      sort: (r) => r.unitName.toLowerCase(),
      cell: (r) => (
        <span className="text-[var(--muted-foreground)]">{r.unitName}</span>
      ),
    },
    {
      key: "signal",
      header: "Movement",
      sort: (r) => signalRank[r.signal],
      cell: (r) => <SignalCell row={r} />,
    },
    {
      key: "out",
      header: "Going out",
      sort: (r) =>
        r.current?.endDate ? new Date(r.current.endDate).getTime() : null,
      cell: (r) => <OutCell row={r} />,
    },
    {
      key: "in",
      header: "Coming in",
      sort: (r) => {
        const first = r.incoming[0];
        return first?.startDate ? new Date(first.startDate).getTime() : null;
      },
      cell: (r) => <InCell row={r} />,
    },
  ];

  return (
    <div className="space-y-4">
      <Stats totals={totals} />

      <FilterBar
        active={filter}
        onChange={setFilter}
        counts={{
          movement: rows.filter((r) => matchesFilter(r, "movement")).length,
          vacancies: rows.filter((r) => matchesFilter(r, "vacancies")).length,
          "ending-soon": rows.filter((r) =>
            matchesFilter(r, "ending-soon"),
          ).length,
          incoming: rows.filter((r) => matchesFilter(r, "incoming")).length,
          all: rows.length,
        }}
      />

      <div className="surface-card overflow-hidden">
        <SortableTable
          columns={columns}
          rows={filteredRows}
          rowKey={(r) => r.id}
          initialSort={{ key: "signal", dir: "asc" }}
          emptyState={
            filter === "all"
              ? "No roles defined yet. Add some on the Org Structure page."
              : "No roles match this filter. Try widening with the chips above."
          }
        />
      </div>
    </div>
  );
}

function Stats({
  totals,
}: {
  totals: {
    all: number;
    vacant: number;
    endingSoon: number;
    incoming: number;
  };
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatBlock
        label="Vacant"
        value={totals.vacant}
        accent={totals.vacant > 0 ? "coral" : undefined}
      />
      <StatBlock label="Ending soon" value={totals.endingSoon} />
      <StatBlock label="Incoming queued" value={totals.incoming} />
      <StatBlock label="Total roles" value={totals.all} />
    </div>
  );
}

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "coral";
}) {
  return (
    <div className="surface-card px-4 py-3">
      <div className="overline">{label}</div>
      <div
        className="text-[24px] font-semibold tabular-nums leading-none mt-1.5"
        style={accent === "coral" ? { color: "var(--raid-coral)" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function FilterBar({
  active,
  onChange,
  counts,
}: {
  active: FilterKey;
  onChange: (k: FilterKey) => void;
  counts: Record<FilterKey, number>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(f.key)}
            className={`chrome-mono text-[11px] px-3 py-1.5 rounded-full transition ${
              isActive
                ? "bg-[var(--raid-blue-deep)] text-white"
                : "bg-white border border-black/10 text-[var(--foreground)] hover:border-[var(--raid-blue)]"
            }`}
          >
            {f.label}
            <span
              className={`ml-1.5 tabular-nums ${
                isActive ? "text-white/70" : "text-[var(--muted-foreground)]"
              }`}
            >
              {counts[f.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SignalCell({ row }: { row: RoleMovementRow }) {
  const badges: { label: string; color: string; bg: string }[] = [];
  if (row.isVacant || row.signal === "vacant") {
    badges.push({
      label: "Vacant",
      color: "var(--raid-coral)",
      bg: "rgba(249,134,107,0.10)",
    });
  }
  if (row.signal === "ending-soon") {
    badges.push({
      label: "Ending soon",
      color: "var(--raid-status-amber-text)",
      bg: "var(--raid-status-amber-bg)",
    });
  }
  if (row.incoming.some((p) => p.status === "Planned")) {
    badges.push({
      label: "Successor planned",
      color: "var(--raid-status-blue-text)",
      bg: "var(--raid-status-blue-bg)",
    });
  } else if (row.incoming.some((p) => p.status === "Candidate")) {
    badges.push({
      label: "Has candidates",
      color: "var(--raid-status-blue-text)",
      bg: "var(--raid-status-blue-bg)",
    });
  }
  if (badges.length === 0) {
    return (
      <span className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
        Stable
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b.label}
          className="font-mono-brand text-[10.5px] font-semibold tracking-[0.07em] uppercase rounded-full px-2 py-0.5"
          style={{ background: b.bg, color: b.color }}
        >
          {b.label}
        </span>
      ))}
    </span>
  );
}

function OutCell({ row }: { row: RoleMovementRow }) {
  if (!row.current) {
    return (
      <span className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
        —
      </span>
    );
  }
  return (
    <div className="leading-snug">
      <Link
        href={`/individuals/${row.current.individualId}`}
        className="hover:underline"
      >
        {row.current.individualName}
      </Link>
      {row.current.rank && (
        <span className="text-[var(--muted-foreground)]">
          {" "}
          · {row.current.rank}
        </span>
      )}
      {row.current.endDate && (
        <div className="chrome-mono text-[10px] text-[var(--muted-foreground)] mt-0.5">
          ends {row.current.endDate}
        </div>
      )}
    </div>
  );
}

function InCell({ row }: { row: RoleMovementRow }) {
  if (row.incoming.length === 0) {
    return (
      <span className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
        —
      </span>
    );
  }
  // Show top 2; collapse remainder
  const shown = row.incoming.slice(0, 2);
  const rest = row.incoming.length - shown.length;
  return (
    <ul className="space-y-1">
      {shown.map((p) => (
        <li key={p.id} className="flex items-center gap-2 leading-snug">
          <StatusBadge status={p.status} />
          <Link
            href={`/individuals/${p.individualId}`}
            className="hover:underline"
          >
            {p.individualName}
          </Link>
          {p.startDate && (
            <span className="chrome-mono text-[10px] text-[var(--muted-foreground)]">
              {p.startDate}
            </span>
          )}
        </li>
      ))}
      {rest > 0 && (
        <li className="chrome-mono text-[10px] text-[var(--muted-foreground)]">
          + {rest} more
        </li>
      )}
    </ul>
  );
}
