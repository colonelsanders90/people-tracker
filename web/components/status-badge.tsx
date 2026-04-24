import { Badge } from "@/components/ui/badge";
import type { PostingStatus } from "@/lib/db/schema";

const styles: Record<PostingStatus, string> = {
  Past: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  Current: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Planned: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Candidate: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

export function StatusBadge({ status }: { status: PostingStatus }) {
  return (
    <Badge variant="secondary" className={styles[status]}>
      {status}
    </Badge>
  );
}
