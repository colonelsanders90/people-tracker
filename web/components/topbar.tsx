import { RAiD } from "@/components/raid";
import type { Role } from "@/lib/auth";

/**
 * Thin navy strip that runs along the top of content on desktop.
 * Pairs with the sidebar to form the merged dark chrome frame.
 */
export function Topbar({
  section,
  role,
}: {
  section?: string;
  role?: Role;
}) {
  return (
    <div className="hidden md:flex h-[52px] bg-[var(--raid-blue-deep)] text-white items-center px-6 border-b border-white/10 sticky top-0 z-20">
      <span className="overline-on-dark">
        <RAiD /> · INTRANET ·{" "}
        <span className="text-white/85">{section ?? "Manpower"}</span>
      </span>
      <span className="ml-auto chrome-mono text-white/60">
        {role === "admin" ? "HR Officer · Admin" : "Viewer"}
      </span>
    </div>
  );
}
