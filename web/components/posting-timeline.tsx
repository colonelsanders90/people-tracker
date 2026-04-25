import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import type { PostingWithRelations } from "@/lib/queries";

type Mode = "individual" | "role";

// Fixed 4-year window centred on today: today − 2y … today + 2y.
// Postings that extend beyond the window are clipped at the window edge with
// a directional chevron (« or »), and postings entirely outside the window are
// summarised in compact text rows above / below the bar timeline.
const WINDOW_YEARS_BACK = 2;
const WINDOW_YEARS_FORWARD = 2;

function parseDate(d: string | null, fallback: Date): Date {
  return d ? new Date(d) : fallback;
}

function pctBetween(d: Date, start: Date, end: Date): number {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, ((d.getTime() - start.getTime()) / total) * 100),
  );
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

function fmt(d: string | null): string {
  return d ?? "?";
}

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

  const today = new Date();
  const windowStart = new Date(
    today.getFullYear() - WINDOW_YEARS_BACK,
    today.getMonth(),
    today.getDate(),
  );
  const windowEnd = new Date(
    today.getFullYear() + WINDOW_YEARS_FORWARD,
    today.getMonth(),
    today.getDate(),
  );

  // Year + quarter ticks inside the window.
  const yearTicks: { date: Date; year: number }[] = [];
  const quarterTicks: Date[] = [];
  for (
    let y = windowStart.getFullYear();
    y <= windowEnd.getFullYear() + 1;
    y++
  ) {
    for (let q = 0; q < 4; q++) {
      const m = q * 3;
      const d = new Date(y, m, 1);
      if (d < windowStart || d > windowEnd) continue;
      if (m === 0) yearTicks.push({ date: d, year: y });
      else quarterTicks.push(d);
    }
  }

  const todayPct = pctBetween(today, windowStart, windowEnd);

  // Partition postings: in-window (rendered as bars), entirely earlier, entirely later.
  type Categorised =
    | { kind: "dateless"; posting: PostingWithRelations }
    | { kind: "in-window"; posting: PostingWithRelations; start: Date; end: Date }
    | { kind: "earlier"; posting: PostingWithRelations }
    | { kind: "later"; posting: PostingWithRelations };

  const items: Categorised[] = postings.map((p) => {
    // No start date at all → "Dates TBD" strip (only sensible for forward-looking statuses).
    if (!p.startDate && (p.status === "Candidate" || p.status === "Planned")) {
      return { kind: "dateless", posting: p };
    }
    const start = parseDate(p.startDate, today);

    // If no end date, derive one so the bar has a sensible width:
    //  - Planned/Candidate: assume the role's standardTenureMonths (default 24)
    //  - Current: assume ongoing through the role's standardTenureMonths from start
    //  - Past with no end: fall back to today
    let end: Date;
    if (p.endDate) {
      end = new Date(p.endDate);
    } else if (p.status === "Past") {
      end = today;
    } else {
      const months = p.role.standardTenureMonths ?? 24;
      end = new Date(start);
      end.setMonth(end.getMonth() + months);
    }

    if (end < windowStart) return { kind: "earlier", posting: p };
    if (start > windowEnd) return { kind: "later", posting: p };
    return { kind: "in-window", posting: p, start, end };
  });

  const earlier = items.filter((i) => i.kind === "earlier");
  const later = items.filter((i) => i.kind === "later");
  const visible = items.filter(
    (i) => i.kind === "in-window" || i.kind === "dateless",
  );

  return (
    <div className="space-y-3">
      {earlier.length > 0 && (
        <OutOfWindowList
          label={`Earlier postings (${earlier.length})`}
          postings={earlier.map((e) => e.posting)}
          mode={mode}
        />
      )}

      {/* Year axis */}
      <div className="relative h-5">
        {yearTicks.map((t) => {
          const pct = pctBetween(t.date, windowStart, windowEnd);
          return (
            <div
              key={t.year}
              className="absolute top-0 chrome-mono text-[var(--foreground)] -translate-x-1/2 font-medium"
              style={{ left: `${pct}%`, fontSize: 11 }}
            >
              {t.year}
            </div>
          );
        })}
      </div>

      <div className="relative">
        {/* Quarter dotted lines */}
        {quarterTicks.map((d, i) => {
          const pct = pctBetween(d, windowStart, windowEnd);
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-dotted border-black/15 pointer-events-none"
              style={{ left: `${pct}%` }}
              aria-hidden
            />
          );
        })}

        {/* Year solid lines */}
        {yearTicks.map((t) => {
          const pct = pctBetween(t.date, windowStart, windowEnd);
          return (
            <div
              key={`y-${t.year}`}
              className="absolute top-0 bottom-0 border-l border-black/15 pointer-events-none"
              style={{ left: `${pct}%` }}
              aria-hidden
            />
          );
        })}

        {/* Today marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-[var(--raid-coral)] z-10"
          style={{ left: `${todayPct}%` }}
          aria-label="Today"
        />
        <div
          className="absolute top-0 chrome-mono text-[var(--raid-coral)] -translate-x-1/2 -translate-y-full pb-1 z-10"
          style={{ left: `${todayPct}%`, fontSize: 9 }}
        >
          NOW
        </div>

        <ul className="space-y-2 relative">
          {visible.map((item) => {
            const p = item.posting;
            const label =
              mode === "individual"
                ? `${p.role.title} · ${p.role.unit?.name ?? p.role.externalUnit ?? "External"}`
                : p.individual.name;
            const href =
              mode === "individual"
                ? `/roles/${p.role.id}`
                : `/individuals/${p.individual.id}`;

            if (item.kind === "dateless") {
              return (
                <li key={p.id} className="relative h-7">
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
                </li>
              );
            }

            // in-window: clip start/end to window with directional chevrons
            const { start, end } = item;
            const startsBeforeWindow = start < windowStart;
            const endsAfterWindow = end > windowEnd;
            const clippedStart = startsBeforeWindow ? windowStart : start;
            const clippedEnd = endsAfterWindow ? windowEnd : end;
            const leftPct = pctBetween(clippedStart, windowStart, windowEnd);
            const rightPct = pctBetween(clippedEnd, windowStart, windowEnd);
            const widthPct = Math.max(rightPct - leftPct, 1.5);

            return (
              <li key={p.id} className="relative h-7">
                <div
                  className="absolute inset-y-0 flex items-center gap-1.5 px-2 text-xs overflow-hidden"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    background: barColors[p.status],
                    color: barText[p.status],
                    borderTopLeftRadius: startsBeforeWindow ? 0 : 6,
                    borderBottomLeftRadius: startsBeforeWindow ? 0 : 6,
                    borderTopRightRadius: endsAfterWindow ? 0 : 6,
                    borderBottomRightRadius: endsAfterWindow ? 0 : 6,
                  }}
                  title={`${p.status}: ${fmt(p.startDate)} → ${fmt(p.endDate)}`}
                >
                  {startsBeforeWindow && (
                    <span
                      aria-hidden
                      className="font-bold flex-shrink-0"
                      title={`Started ${p.startDate ?? "earlier"}`}
                    >
                      «
                    </span>
                  )}
                  <Link
                    href={href}
                    className="truncate hover:underline font-medium"
                  >
                    {label}
                  </Link>
                  {endsAfterWindow && (
                    <span
                      aria-hidden
                      className="font-bold flex-shrink-0 ml-auto"
                      title={`Ends ${p.endDate ?? "later"}`}
                    >
                      »
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {later.length > 0 && (
        <OutOfWindowList
          label={`Later postings (${later.length})`}
          postings={later.map((l) => l.posting)}
          mode={mode}
        />
      )}
    </div>
  );
}

function OutOfWindowList({
  label,
  postings,
  mode,
}: {
  label: string;
  postings: PostingWithRelations[];
  mode: Mode;
}) {
  return (
    <div className="text-xs flex flex-wrap items-center gap-x-3 gap-y-1.5 px-2 py-1.5 bg-black/[0.02] rounded">
      <span className="overline">{label}</span>
      {postings.map((p) => {
        const text =
          mode === "individual"
            ? `${p.role.title} · ${p.role.unit?.name ?? p.role.externalUnit ?? "External"}`
            : p.individual.name;
        const href =
          mode === "individual"
            ? `/roles/${p.role.id}`
            : `/individuals/${p.individual.id}`;
        return (
          <span key={p.id} className="inline-flex items-baseline gap-1.5">
            <StatusBadge status={p.status} />
            <Link href={href} className="hover:underline">
              {text}
            </Link>
            <span className="chrome-mono text-[10px] text-[var(--muted-foreground)]">
              {fmt(p.startDate)} → {fmt(p.endDate)}
            </span>
          </span>
        );
      })}
    </div>
  );
}
