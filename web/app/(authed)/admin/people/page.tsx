export const dynamic = "force-dynamic";

import { getAllIndividuals, getAllPostings } from "@/lib/queries";
import { createIndividual } from "@/app/actions";
import { PersonRow } from "./person-row";

export default async function PeopleAdminPage() {
  const [individuals, postings] = await Promise.all([
    getAllIndividuals(),
    getAllPostings(),
  ]);
  const postingCount = new Map<number, number>();
  for (const p of postings) {
    postingCount.set(
      p.individualId,
      (postingCount.get(p.individualId) ?? 0) + 1,
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-5">
        <div className="overline mb-1">Add an individual</div>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Internal RAiDers go on this list. External candidates can be added
          here too, or just typed inline when creating a posting.
        </p>
        <form
          action={createIndividual}
          className="grid md:grid-cols-2 gap-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="name" className="overline">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. MAJ Jane Lim"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rank" className="overline">
              Rank
            </label>
            <input
              id="rank"
              name="rank"
              placeholder="MAJ / LTC / COL …"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="specialisation" className="overline">
              Specialisation
            </label>
            <input
              id="specialisation"
              name="specialisation"
              placeholder="e.g. Software Engineering"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="employeeId" className="overline">
              Employee ID
            </label>
            <input
              id="employeeId"
              name="employeeId"
              placeholder="Optional"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              name="isExternal"
              id="isExternal"
              className="accent-[var(--raid-blue)]"
            />
            <label
              htmlFor="isExternal"
              className="chrome-mono text-[11px] text-[var(--muted-foreground)] cursor-pointer"
            >
              External (not part of RAiD)
            </label>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-md bg-[var(--raid-blue)] hover:bg-[var(--raid-blue-deep)] text-white text-sm font-medium transition active:scale-[0.98]"
            >
              Add individual
            </button>
          </div>
        </form>
      </section>

      <section className="surface-card p-5">
        <div className="overline mb-3">
          All individuals · {individuals.length} rows
        </div>
        <div className="overflow-hidden rounded-md border border-black/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--raid-blue-deep)] text-white">
                <Th>Name</Th>
                <Th>Rank</Th>
                <Th>Specialisation</Th>
                <Th>Employee ID</Th>
                <Th>Type</Th>
                <Th align="right">Postings</Th>
                <Th align="right">&nbsp;</Th>
              </tr>
            </thead>
            <tbody>
              {individuals.map((i, idx) => (
                <PersonRow
                  key={i.id}
                  person={i}
                  postingCount={postingCount.get(i.id) ?? 0}
                  zebra={idx % 2 === 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const inputClass =
  "w-full border border-black/15 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--raid-blue)] focus:ring-2 focus:ring-[var(--raid-blue)]/20 transition";

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
