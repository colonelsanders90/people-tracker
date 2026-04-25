import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { requireAuth } from "@/lib/auth";

export default async function AuthedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();

  return (
    <>
      <Sidebar role={session.role} />
      <div className="md:ml-[220px] flex flex-col min-h-screen">
        <Topbar role={session.role} />
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1280px] w-full">
          {children}
        </main>
      </div>
    </>
  );
}
