import { redirect } from "next/navigation";
import Image from "next/image";
import { isAuthed } from "@/lib/auth";
import { signIn } from "@/app/auth-actions";
import { RAiD } from "@/components/raid";

export const dynamic = "force-dynamic";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthed()) redirect("/");
  const sp = await props.searchParams;
  const errorMsg =
    sp.error === "empty"
      ? "Enter a password."
      : sp.error === "invalid"
        ? "That password didn't match either role."
        : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--raid-blue-deep)] p-4">
      <div className="w-full max-w-sm bg-white rounded-[10px] overflow-hidden shadow-[0_20px_48px_rgba(1,33,156,0.20)]">
        <div className="bg-[var(--raid-blue-deep)] text-white px-6 py-5">
          <Image
            src="/raid/White_RAiD_onNavy.svg"
            alt="RAiD"
            width={100}
            height={45}
            priority
            className="h-9 w-auto"
          />
          <div className="overline-on-dark mt-3">Manpower Tracker</div>
        </div>
        <form action={signIn} className="p-6 space-y-5">
          <div>
            <h1 className="text-xl font-semibold">
              Sign in to <RAiD />
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Use the HR officer password for admin access, or the team
              password for viewer access.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="overline">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              className="w-full border border-black/15 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--raid-blue)] focus:ring-2 focus:ring-[var(--raid-blue)]/20 transition"
            />
          </div>

          {errorMsg && (
            <div
              className="text-sm rounded-md px-3 py-2"
              style={{
                background: "var(--raid-status-amber-bg)",
                color: "var(--raid-status-amber-text)",
              }}
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-[var(--raid-blue)] hover:bg-[var(--raid-blue-deep)] text-white text-sm font-medium transition active:scale-[0.98]"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
