export const dynamic = "force-dynamic";

import { StatusBadge } from "@/components/status-badge";
import {
  getAllIndividuals,
  getAllRoles,
  getAllUnits,
  getAllPostings,
} from "@/lib/queries";
import {
  createPosting,
  deletePosting,
  toggleRoleVacancy,
} from "@/app/actions";

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
          HR officer surface — add postings (past, current, planned, candidate),
          mark vacancies, remove rows.
        </p>
      </header>

      {/* Add posting form */}
      <section className="surface-card p-5">
        <div className="overline mb-1">Add a posting</div>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Pair an individual with a role. Status determines whether it&apos;s a
          historical record or a forward-looking plan / candidate.
        </p>
        <form action={createPosting} className="grid md:grid-cols-2 gap-4">
          <Field label="Individual" htmlFor="individualId">
            <select id="individualId" name="individualId" required className={selectClass}>
              <option value="">Select a person…</option>
              {individuals.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.rank ? ` (${i.rank})` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Role" htmlFor="roleId">
            <select id="roleId" name="roleId" required className={selectClass}>
              <option value="">Select a role…</option>
              {roles.map((r) => {
                const u = unitById.get(r.unitId);
                return (
                  <option key={r.id} value={r.id}>
                    {r.title} — {u?.name} ({r.level})
                  </option>
                );
              })}
            </select>
          </Field>

          <Field label="Status" htmlFor="status">
            <select
              id="status"
              name="status"
              required
              defaultValue="Candidate"
              className={selectClass}
            >
              <option value="Past">Past</option>
              <option value="Current">Current</option>
              <option value="Planned">Planned</option>
              <option value="Candidate">Candidate</option>
            </select>
          </Field>

          <div className="md:col-span-1" />

          <Field label="Start date" htmlFor="startDate">
            <input
              id="startDate"
              name="startDate"
              type="date"
              className={inputClass}
            />
          </Field>

          <Field label="End date" htmlFor="endDate">
            <input
              id="endDate"
              name="endDate"
              type="date"
              className={inputClass}
            />
          </Field>

          <Field label="Notes" htmlFor="notes">
            <input
              id="notes"
              name="notes"
              placeholder="Optional context"
              className={`md:col-span-2 ${inputClass}`}
            />
          </Field>

          <div className="md:col-span-2">
            <button type="submit" className={primaryButtonClass}>
              Add posting
            </button>
          </div>
        </form>
      </section>

      {/* All postings */}
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
                <Th align="right">Actions</Th>
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
                  <Td align="right">
                    <form action={deletePosting} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className={ghostDangerClass}>
                        Delete
                      </button>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Vacancy flags */}
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
                <Th align="right">Action</Th>
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
                    <Td align="right">
                      <form action={toggleRoleVacancy} className="inline">
                        <input type="hidden" name="id" value={r.id} />
                        <input
                          type="hidden"
                          name="isVacant"
                          value={String(r.isVacant)}
                        />
                        <button type="submit" className={ghostButtonClass}>
                          {r.isVacant ? "Mark filled" : "Mark vacant"}
                        </button>
                      </form>
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

const inputClass =
  "w-full border border-black/15 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--raid-blue)] focus:ring-2 focus:ring-[var(--raid-blue)]/20 transition";
const selectClass = inputClass;
const primaryButtonClass =
  "inline-flex items-center px-4 py-2 rounded-md bg-[var(--raid-blue)] hover:bg-[var(--raid-blue-deep)] text-white text-sm font-medium transition active:scale-[0.98]";
const ghostButtonClass =
  "inline-flex items-center px-2.5 py-1 chrome-mono text-[11px] text-[var(--raid-blue-deep)] hover:bg-[var(--raid-blue)]/10 rounded transition";
const ghostDangerClass =
  "inline-flex items-center px-2.5 py-1 chrome-mono text-[11px] text-[#B33] hover:bg-red-50 rounded transition";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="overline">
        {label}
      </label>
      {children}
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={`px-4 py-2.5 chrome-mono text-white/85 text-[11px] font-medium tracking-wider ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  muted,
}: {
  children: React.ReactNode;
  align?: "right";
  muted?: boolean;
}) {
  return (
    <td
      className={`px-4 py-2.5 ${align === "right" ? "text-right" : ""} ${
        muted ? "text-[var(--muted-foreground)]" : ""
      }`}
    >
      {children}
    </td>
  );
}
