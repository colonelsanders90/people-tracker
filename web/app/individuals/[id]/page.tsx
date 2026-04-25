import Link from "next/link";
import { notFound } from "next/navigation";
import { OrgChart } from "@/components/org-chart";
import { PostingTimeline } from "@/components/posting-timeline";
import { StatusBadge } from "@/components/status-badge";
import {
  getIndividual,
  getPostingsForIndividual,
  getAllUnits,
  getAllRoles,
  getCurrentIncumbentsByRole,
} from "@/lib/queries";
import { buildUnitTree } from "@/lib/hierarchy";

export default async function IndividualViewPage(
  props: PageProps<"/individuals/[id]">,
) {
  const { id } = await props.params;
  const individualId = Number(id);
  if (!Number.isFinite(individualId)) notFound();

  const [individual, postings, units, roles] = await Promise.all([
    getIndividual(individualId),
    getPostingsForIndividual(individualId),
    getAllUnits(),
    getAllRoles(),
  ]);
  if (!individual) notFound();

  const incumbents = await getCurrentIncumbentsByRole(roles.map((r) => r.id));
  const tree = buildUnitTree(units, roles);

  const current = postings.find((p) => p.status === "Current");
  const future = postings.filter(
    (p) => p.status === "Planned" || p.status === "Candidate",
  );
  const past = postings.filter((p) => p.status === "Past");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/individuals"
          className="chrome-mono text-[11px] text-[var(--muted-foreground)] hover:text-[var(--raid-blue-deep)]"
        >
          ← Individuals
        </Link>
      </div>

      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Individual</div>
        <h1 className="text-3xl mt-1">{individual.name}</h1>
        <div className="flex flex-wrap gap-x-3 gap-y-1 chrome-mono text-[11px] text-[var(--muted-foreground)] mt-2">
          {individual.rank && <span>{individual.rank}</span>}
          {individual.specialisation && <span>· {individual.specialisation}</span>}
          {individual.employeeId && <span>· {individual.employeeId}</span>}
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="surface-card p-5">
            <div className="overline mb-3">Movement timeline</div>
            <PostingTimeline postings={postings} mode="individual" />
          </section>

          <section className="surface-card p-5">
            <div className="overline mb-3">Where next?</div>
            {future.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] italic">
                No planned or candidate postings yet. Add one from the admin page.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {future.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-start gap-3 text-sm border border-black/[0.06] rounded-md p-3 bg-black/[0.015]"
                  >
                    <StatusBadge status={p.status} />
                    <div className="flex-1">
                      <Link
                        href={`/roles/${p.role.id}`}
                        className="font-medium hover:underline text-[var(--raid-blue-deep)]"
                      >
                        {p.role.title}
                      </Link>
                      <span className="text-[var(--muted-foreground)]">
                        {" "}
                        · {p.role.unit.name} · {p.role.level}
                      </span>
                      {(p.startDate || p.endDate) && (
                        <div className="chrome-mono text-[10px] text-[var(--muted-foreground)] mt-1">
                          {p.startDate ?? "?"} → {p.endDate ?? "?"}
                        </div>
                      )}
                      {p.notes && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-1.5 italic">
                          {p.notes}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <section className="surface-card p-5">
              <div className="overline mb-3">Past postings</div>
              <ul className="space-y-2 text-sm">
                {past.map((p) => (
                  <li key={p.id} className="flex items-start gap-3">
                    <StatusBadge status={p.status} />
                    <div className="flex-1">
                      <Link
                        href={`/roles/${p.role.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.role.title}
                      </Link>
                      <span className="text-[var(--muted-foreground)]">
                        {" "}
                        · {p.role.unit.name}
                      </span>
                      <span className="chrome-mono text-[10px] text-[var(--muted-foreground)] ml-2">
                        {p.startDate} → {p.endDate}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside>
          <section className="surface-card p-4">
            <div className="overline mb-3">Org context</div>
            {current && (
              <p className="chrome-mono text-[10.5px] text-[var(--muted-foreground)] mb-3 leading-snug">
                Currently:{" "}
                <span className="text-[var(--foreground)] font-medium">
                  {current.role.title}
                </span>{" "}
                · {current.role.unit.name}
              </p>
            )}
            <OrgChart
              tree={tree}
              incumbents={incumbents}
              highlightRoleId={current?.role.id}
              highlightUnitId={current?.role.unit.id}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
