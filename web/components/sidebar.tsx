"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth";
import { signOut } from "@/app/auth-actions";

type Link = { href: string; label: string; adminOnly?: boolean };

const links: Link[] = [
  { href: "/", label: "Dashboard" },
  { href: "/org", label: "Org Structure" },
  { href: "/individuals", label: "Individuals" },
  { href: "/roles", label: "Roles" },
  { href: "/admin", label: "Admin", adminOnly: true },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname() ?? "/";
  const visible = links.filter((l) => !l.adminOnly || role === "admin");

  return (
    <>
      {/* Desktop sidebar — 220px navy panel */}
      <aside className="hidden md:flex md:fixed md:left-0 md:top-0 md:bottom-0 md:w-[220px] md:flex-col bg-[var(--raid-blue-deep)] text-white z-30">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="block">
            <Image
              src="/raid/White_RAiD_onNavy.svg"
              alt="RAiD"
              width={96}
              height={43}
              priority
              className="h-9 w-auto"
            />
          </Link>
          <div className="overline-on-dark mt-3">Manpower Tracker</div>
        </div>

        <nav className="flex-1 p-3">
          {visible.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative block px-3 py-2 chrome-mono transition rounded-none ${
                  active
                    ? "text-white bg-[rgba(0,142,208,0.25)]"
                    : "text-white/70 hover:text-white hover:bg-white/[0.07]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--raid-blue)]" />
                )}
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-2 chrome-mono text-[10px] uppercase tracking-wider text-white/60">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  role === "admin"
                    ? "var(--raid-blue-light)"
                    : "rgba(255,255,255,0.4)",
              }}
            />
            {role === "admin" ? "HR Officer" : "Viewer"}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="chrome-mono text-[10px] text-white/60 hover:text-white transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bar — navy strip with horizontally scrolling links */}
      <header className="md:hidden bg-[var(--raid-blue-deep)] text-white sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10">
          <Image
            src="/raid/White_RAiD_onNavy.svg"
            alt="RAiD"
            width={72}
            height={32}
            className="h-7 w-auto"
          />
          <span className="overline-on-dark">Manpower Tracker</span>
          <form action={signOut} className="ml-auto">
            <button
              type="submit"
              className="chrome-mono text-[10px] text-white/70"
            >
              Sign out
            </button>
          </form>
        </div>
        <nav className="flex gap-1 px-3 py-2 overflow-x-auto">
          {visible.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 px-3 py-1.5 chrome-mono ${
                  active
                    ? "text-white bg-[rgba(0,142,208,0.25)] border-l-2 border-[var(--raid-blue)]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
