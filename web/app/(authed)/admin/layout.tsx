import { requireAdmin } from "@/lib/auth";
import { RAiD } from "@/components/raid";
import { AdminTabs } from "./admin-nav";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Admin</div>
        <h1 className="text-2xl mt-1">
          <RAiD /> Admin
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          HR officer surface — manage postings and people. For branches and
          roles, edit them inline on the{" "}
          <a href="/org" className="underline">
            Org Structure
          </a>{" "}
          page.
        </p>
      </header>
      <AdminTabs />
      {children}
    </div>
  );
}
