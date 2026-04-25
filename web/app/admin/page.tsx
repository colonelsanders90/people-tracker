export const dynamic = "force-dynamic";

import { StatusBadge } from "@/components/status-badge";
import {
  getAllIndividuals,
  getAllRoles,
  getAllUnits,
  getAllPostings,
} from "@/lib/queries";

export default async function AdminPage() {
  const [individuals, roles, units, postings] = await Promise.all([
    getAllIndividuals(),
    getAllRoles(),
    getAllUnits(),
    getAllPostings(),
  ]);
  const unitById = new Map(units.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Admin</div>
        <h1 className="text-2xl mt-1">Admin</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          HR officer surface for adding postings, marking vacancies, and removing
          rows.
        </p>
      </header>

      <div
        className="rounded-md p-4 flex items-start gap-3 text-sm"
        style={{
          background: "var(--raid-status-amber-bg)",
          color: "var(--raid-status-amber-text)",
          border: "1px dashed #BA7517",
        }}
      >
        <span className="font-mono-brand text-[10.5px] uppercase tracking-wider font-semibold mt-0.5">
          Read-only
        </span>
        <p className="leading-relaxed">
          This prototype is wired to mock data — Add / Delete / Toggle actions are
          stubbed. Connect the Postgres database to enable mutations.
        </p>
      </div>

      <section className="surface-card p-5">
        <div className="overline mb-3">All postings · {postings.length} rows</div>
        <div className="overflow-hidden rounded-md border border-black/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--raid-blue-deep)] text-white">
                <Th>Status</Th>
                <Th>Individual</Th>
                <Th>Role</Th>
                <Th>Dates</Th>
                <Th>Notes</Th>
              </tr>
            </thead>
            <tbody>
              {postings.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`border-t border-black/[0.06] ${
                    idx % 2 === 1 ? "bg-black/[0.015]" : ""
                  }`}
                >
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td>{p.individual.name}</Td>
                  <Td>
                    {p.role.title}{" "}
                    <span className="text-[var(--muted-foreground)]">
                      · {p.role.unit.name}
                    </span>
                  </Td>
                  <Td>
                    <span className="chrome-mono text-[10px] text-[var(--muted-foreground)]">
                      {p.startDate ?? "—"} → {p.endDate ?? "—"}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-[var(--muted-foreground)] text-xs italic max-w-[260px] truncate inline-block align-bottom">
                      {p.notes ?? ""}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="overline mb-3">Vacancy flags · {roles.length} roles</div>
        <div className="overflow-hidden rounded-md border border-black/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--raid-blue-deep)] text-white">
                <Th>Role</Th>
                <Th>Unit</Th>
                <Th>Level</Th>
                <Th>Vacant?</Th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r, idx) => {
                const unit = unitById.get(r.unitId);
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-black/[0.06] ${
                      idx % 2 === 1 ? "bg-black/[0.015]" : ""
                    }`}
                  >
                    <Td>{r.title}</Td>
                    <Td muted>{unit?.name}</Td>
                    <Td muted>
                      <span className="chrome-mono">{r.level}</span>
                    </Td>
                    <Td>
                      {r.isVacant ? (
                        <span
                          className="overline"
                          style={{ color: "var(--raid-coral)" }}
                        >
                          Vacant
                        </span>
                      ) : (
                        <span className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                          Filled
                        </span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="chrome-mono text-[10.5px] text-[var(--muted-foreground)]">
        {individuals.length} individuals · {roles.length} roles · {units.length} units
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 chrome-mono text-white/85 text-[11px] font-medium tracking-wider text-left">
      {children}
    </th>
  );
}

function Td({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <td
      className={`px-4 py-2.5 ${muted ? "text-[var(--muted-foreground)]" : ""}`}
    >
      {children}
    </td>
  );
}
