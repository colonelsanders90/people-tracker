export const dynamic = "force-dynamic";

import { getAllIndividuals, getAllPostings } from "@/lib/queries";
import { IndividualsTable, type IndividualRow } from "./individuals-table";

export default async function IndividualsPage() {
  const [individuals, postings] = await Promise.all([
    getAllIndividuals(),
    getAllPostings(),
  ]);

  const currentByIndividual = new Map<
    number,
    IndividualRow["current"]
  >();
  const futureByIndividual = new Map<number, IndividualRow["future"]>();
  for (const p of postings) {
    if (p.status === "Current") {
      currentByIndividual.set(p.individualId, {
        roleId: p.role.id,
        roleTitle: p.role.title,
        unitName: p.role.unit?.name ?? p.role.externalUnit ?? "External",
      });
    }
    if (p.status === "Planned" || p.status === "Candidate") {
      const list = futureByIndividual.get(p.individualId) ?? [];
      list.push({
        id: p.id,
        status: p.status,
        startDate: p.startDate,
        roleId: p.role.id,
        roleTitle: p.role.title,
        unitName: p.role.unit?.name ?? p.role.externalUnit ?? "External",
      });
      futureByIndividual.set(p.individualId, list);
    }
  }

  const rows: IndividualRow[] = individuals.map((i) => ({
    id: i.id,
    name: i.name,
    isExternal: i.isExternal,
    current: currentByIndividual.get(i.id) ?? null,
    future: futureByIndividual.get(i.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Individuals</div>
        <h1 className="text-2xl mt-1">Individuals</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {individuals.length} people. Click a column header to sort. Click a
          name to see the movement timeline and where they might go next.
        </p>
      </header>

      <IndividualsTable rows={rows} />
    </div>
  );
}
