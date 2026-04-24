import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-6 text-sm">
        <Link href="/" className="font-semibold">
          Manpower Tracker
        </Link>
        <Link
          href="/individuals"
          className="text-muted-foreground hover:text-foreground"
        >
          Individuals
        </Link>
        <Link
          href="/roles"
          className="text-muted-foreground hover:text-foreground"
        >
          Roles
        </Link>
        <Link
          href="/admin"
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          Admin
        </Link>
      </div>
    </nav>
  );
}
