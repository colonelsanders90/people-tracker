export const dynamic = "force-dynamic";

import { StatusBadge } from "@/components/status-badge";
import {
  getAllIndividuals,
  getAllRoles,
  getAllUnits,
  getAllPostings,
} from "@/lib/queries";
import { createPosting, deletePosting } from "@/app/actions";
import { PostingForm } from "./posting-form";

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
                  <Td>
                    {p.individual.name}
                    {p.individual.isExternal && (
                      <span className="ml-2 chrome-mono text-[10px] text-[var(--muted-foreground)]">
                        external
                      </span>
                    )}
                  </Td>
                  <Td>
                    {p.role.title}{" "}
                    <span className="text-[var(--muted-foreground)]">
                      ·{" "}
                      {p.role.unit?.name ?? p.role.externalUnit ?? "External"}
                    </span>
                    {p.role.isExternal && (
                      <span className="ml-2 chrome-mono text-[10px] text-[var(--muted-foreground)]">
                        external
                      </span>
                    )}
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
                      <button
                        type="submit"
                        className="inline-flex items-center px-2.5 py-1 chrome-mono text-[11px] text-[#B33] hover:bg-red-50 rounded transition"
                      >
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
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <td className={`px-4 py-2.5 ${align === "right" ? "text-right" : ""}`}>
      {children}
    </td>
  );
}
