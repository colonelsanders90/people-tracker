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

const barColors: Record<PostingWithRelations["status"], string> = {
  Past: "#B4B2A9",
  Current: "#008ED0",
  Planned: "#1746EA",
  Candidate: "#FAEEDA",
};
const barText: Record<PostingWithRelations["status"], string> = {
  Past: "#FFFFFF",
  Current: "#FFFFFF",
  Planned: "#FFFFFF",
  Candidate: "#633806",
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
      <div className="text-sm text-[var(--muted-foreground)] italic py-8 text-center font-mono-brand">
        No postings recorded.
      </div>
    );
  }

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
  const startYear = minDate.getFullYear();
  const endYear = maxDate.getFullYear();
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  return (
    <div className="space-y-3">
      <div className="relative h-5 border-b border-black/10">
        {years.map((y) => {
          const pct = pctBetween(new Date(y, 0, 1), minDate, maxDate);
          return (
            <div
              key={y}
              className="absolute top-0 chrome-mono text-[var(--muted-foreground)] -translate-x-1/2"
              style={{ left: `${pct}%`, fontSize: 10 }}
            >
              {y}
            </div>
          );
        })}
      </div>

      <div className="relative">
        <div
          className="absolute top-0 bottom-0 w-px bg-[var(--raid-coral)] z-10"
          style={{ left: `${todayPct}%` }}
          aria-label="Today"
        />
        <div
          className="absolute top-0 chrome-mono text-[var(--raid-coral)] -translate-x-1/2 -translate-y-full pb-1"
          style={{ left: `${todayPct}%`, fontSize: 9 }}
        >
          NOW
        </div>

        <ul className="space-y-2">
          {postings.map((p) => {
            const start = parseDate(p.startDate, today);
            const end = parseDate(p.endDate, start);
            const leftPct = pctBetween(start, minDate, maxDate);
            const rightPct = pctBetween(end, minDate, maxDate);
            const widthPct = Math.max(rightPct - leftPct, 1.5);

            const label =
              mode === "individual"
                ? `${p.role.title} · ${p.role.unit?.name ?? p.role.externalUnit ?? "External"}`
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
                  <div
                    className="absolute inset-y-0 left-0 right-0 flex items-center gap-2 text-xs px-2 rounded"
                    style={{
                      background: "var(--raid-status-amber-bg)",
                      border: "1px dashed #BA7517",
                    }}
                  >
                    <StatusBadge status={p.status} />
                    <Link
                      href={href}
                      className="hover:underline font-medium"
                      style={{ color: "var(--raid-status-amber-text)" }}
                    >
                      {label}
                    </Link>
                    <span className="font-mono-brand text-[10px] uppercase tracking-wider opacity-70">
                      Dates TBD
                    </span>
                  </div>
                ) : (
                  <div
                    className="absolute inset-y-0 rounded flex items-center gap-2 px-2 text-xs"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      background: barColors[p.status],
                      color: barText[p.status],
                    }}
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
