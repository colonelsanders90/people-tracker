import type { PostingStatus } from "@/lib/db/schema";

const styles: Record<PostingStatus, { bg: string; text: string; label: string }> = {
  Past: {
    bg: "var(--raid-status-gray-bg)",
    text: "var(--raid-status-gray-text)",
    label: "Past",
  },
  Current: {
    bg: "var(--raid-status-green-bg)",
    text: "var(--raid-status-green-text)",
    label: "Current",
  },
  Planned: {
    bg: "var(--raid-status-blue-bg)",
    text: "var(--raid-status-blue-text)",
    label: "Planned",
  },
  Candidate: {
    bg: "var(--raid-status-amber-bg)",
    text: "var(--raid-status-amber-text)",
    label: "Candidate",
  },
};

export function StatusBadge({ status }: { status: PostingStatus }) {
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center font-mono-brand text-[10.5px] font-semibold tracking-[0.07em] uppercase rounded-full px-2 py-0.5 whitespace-nowrap"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}
