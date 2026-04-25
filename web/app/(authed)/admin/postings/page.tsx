export const dynamic = "force-dynamic";

import {
  getAllIndividuals,
  getAllRoles,
  getAllUnits,
  getAllPostings,
} from "@/lib/queries";
import { createPosting } from "@/app/actions";
import { PostingForm } from "./posting-form";
import { PostingsTable, type PostingRow } from "./postings-table";

export default async function PostingsAdminPage() {
  const [individuals, roles, units, postings] = await Promise.all([
    getAllIndividuals(),
    getAllRoles(),
    getAllUnits(),
    getAllPostings(),
  ]);
  const unitById = new Map(units.map((u) => [u.id, u]));
  const internalRoles = roles.filter((r) => !r.isExternal);
  const internalIndividuals = individuals.filter((i) => !i.isExternal);

  const rows: PostingRow[] = postings.map((p) => ({
    id: p.id,
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
    notes: p.notes,
    individualId: p.individualId,
    individualName: p.individual.name,
    individualIsExternal: p.individual.isExternal,
    roleId: p.roleId,
    roleTitle: p.role.title,
    unitName: p.role.unit?.name ?? p.role.externalUnit ?? "External",
    roleIsExternal: p.role.isExternal,
  }));

  return (
    <div className="space-y-6">
      <section className="surface-card p-5">
        <div className="overline mb-1">Add a posting</div>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Pair a person with a role. Use the toggles when the role or person is
          outside RAiD.
        </p>
        <PostingForm
          action={createPosting}
          individuals={internalIndividuals}
          roles={internalRoles.map((r) => {
            const u = r.unitId == null ? null : unitById.get(r.unitId);
            return {
              id: r.id,
              title: r.title,
              level: r.level,
              unitName: u?.name ?? "—",
            };
          })}
        />
      </section>

      <section className="surface-card p-5">
        <div className="overline mb-3">All postings · {postings.length} rows</div>
        <PostingsTable rows={rows} />
      </section>
    </div>
  );
}
