"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/postings", label: "Postings" },
  { href: "/admin/people", label: "People" },
];

export function AdminTabs() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      role="tablist"
      className="flex gap-1 border-b border-black/[0.08]"
      aria-label="Admin sections"
    >
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            role="tab"
            aria-selected={active}
            className={`px-4 py-2 chrome-mono text-[12px] -mb-[1px] border-b-2 transition ${
              active
                ? "border-[var(--raid-blue)] text-[var(--raid-blue-deep)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
