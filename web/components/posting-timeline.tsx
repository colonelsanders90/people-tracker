import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import type { PostingWithRelations } from "@/lib/queries";

type Mode = "individual" | "role";

const today = new Date();
const DEFAULT_START = new Date(today.getFullYear() - 2, 0, 1);
const DEFAULT_END = new Date(today.getFullYear() + 2, 11, 31);

function parseDate(d: string | null, fallback: Date): Date {
  return d ? new Date(d) : fallback;
}

function pctBetween(d: Date, start: Date, end: Date): number {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, ((d.getTime() - start.getTime()) / total) * 100));
}

const barStyles: Record<PostingWithRelations["status"], string> = {
  Past: "bg-neutral-300 dark:bg-neutral-700",
  Current: "bg-emerald-400 dark:bg-emerald-600",
  Planned: "bg-blue-400 dark:bg-blue-600",
  Candidate: "bg-amber-400 dark:bg-amber-600",
};

export function PostingTimeline({
  postings,
  mode,
}: {
  postings: PostingWithRelations[];
  mode: Mode;
}) {
  if (postings.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic py-8 text-center">
        No postings recorded.
      </div>
    );
  }

  // Timeline window — widen to include all postings with dates, plus a buffer.
  let minDate = DEFAULT_START;
  let maxDate = DEFAULT_END;
  for (const p of postings) {
    if (p.startDate) {
      const d = new Date(p.startDate);
      if (d < minDate) minDate = d;
    }
    if (p.endDate) {
      const d = new Date(p.endDate);
      if (d > maxDate) maxDate = d;
    }
  }

  const todayPct = pctBetween(today, minDate, maxDate);

  // Year tick marks
  const startYear = minDate.getFullYear();
  const endYear = maxDate.getFullYear();
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  return (
    <div className="space-y-2">
      {/* Year axis */}
      <div className="relative h-6 border-b border-neutral-200 dark:border-neutral-800">
        {years.map((y) => {
          const pct = pctBetween(new Date(y, 0, 1), minDate, maxDate);
          return (
            <div
              key={y}
              className="absolute top-0 text-xs text-muted-foreground -translate-x-1/2"
              style={{ left: `${pct}%` }}
            >
              {y}
            </div>
          );
        })}
      </div>

      <div className="relative">
        {/* Today marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500/70 z-10"
          style={{ left: `${todayPct}%` }}
          aria-label="Today"
        />

        <ul className="space-y-1.5">
          {postings.map((p) => {
            const start = parseDate(p.startDate, today);
            const end = parseDate(p.endDate, start);
            const leftPct = pctBetween(start, minDate, maxDate);
            const rightPct = pctBetween(end, minDate, maxDate);
            const widthPct = Math.max(rightPct - leftPct, 1);

            const label =
              mode === "individual"
                ? `${p.role.title} (${p.role.unit.name})`
                : p.individual.name;
            const href =
              mode === "individual"
                ? `/roles/${p.role.id}`
                : `/individuals/${p.individual.id}`;

            const datelessCandidate =
              !p.startDate && p.status === "Candidate";

            return (
              <li key={p.id} className="relative h-7">
                {datelessCandidate ? (
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center gap-2 text-xs border border-dashed border-amber-400 rounded px-2 bg-amber-50 dark:bg-amber-950/20">
                    <StatusBadge status={p.status} />
                    <Link
                      href={href}
                      className="hover:underline font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      {label}
                    </Link>
                    <span className="text-muted-foreground">
                      — dates TBD
                    </span>
                  </div>
                ) : (
                  <div
                    className={`absolute inset-y-0 rounded flex items-center gap-2 px-2 text-xs text-white ${barStyles[p.status]}`}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`${p.status}: ${p.startDate ?? "?"} — ${p.endDate ?? "?"}`}
                  >
                    <Link href={href} className="truncate hover:underline font-medium">
                      {label}
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
