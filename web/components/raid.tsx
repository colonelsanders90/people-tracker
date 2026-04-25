/**
 * RAiD wordmark — keeps the lowercase `i` even inside uppercase parents.
 * Brand rule: never `RAID`, never `Raid`. The lowercase `i` is part of the mark.
 */
export function RAiD({ className }: { className?: string }) {
  return (
    <span className={className}>
      RA<span className="ri">i</span>D
    </span>
  );
}

export function RAiDer({
  plural = false,
  className,
}: {
  plural?: boolean;
  className?: string;
}) {
  return (
    <span className={className}>
      RA<span className="ri">i</span>Der{plural ? "s" : ""}
    </span>
  );
}
