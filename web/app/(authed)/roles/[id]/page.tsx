import Link from "next/link";
import { notFound } from "next/navigation";
import { OrgChart } from "@/components/org-chart";
import { PostingTimeline } from "@/components/posting-timeline";
import { StatusBadge } from "@/components/status-badge";
import {
  getRole,
  getPostingsForRole,
  getAllUnits,
  getAllRoles,
  getCurrentIncumbentsByRole,
} from "@/lib/queries";
import { buildUnitTree } from "@/lib/hierarchy";

export default async function RoleViewPage(props: PageProps<"/roles/[id]">) {
  const { id } = await props.params;
  const roleId = Number(id);
  if (!Number.isFinite(roleId)) notFound();

  const [role, postings, units, roles] = await Promise.all([
    getRole(roleId),
    getPostingsForRole(roleId),
    getAllUnits(),
    getAllRoles(),
  ]);
  if (!role) notFound();

  const incumbents = await getCurrentIncumbentsByRole(roles.map((r) => r.id));
  const tree = buildUnitTree(units, roles);

  const future = postings.filter(
    (p) => p.status === "Planned" || p.status === "Candidate",
  );
  const past = postings.filter((p) => p.status === "Past");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/roles"
          className="chrome-mono text-[11px] text-[var(--muted-foreground)] hover:text-[var(--raid-blue-deep)]"
        >
          ← Roles
        </Link>
      </div>

      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Role</div>
        <div className="flex items-baseline gap-3 flex-wrap mt-1">
          <h1 className="text-3xl">{role.title}</h1>
          {role.isVacant && (
            <span
              className="overline text-[12px]"
              style={{ color: "var(--raid-coral)" }}
            >
              Vacant
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 chrome-mono text-[11px] text-[var(--muted-foreground)] mt-2">
          <span>{role.unit?.name ?? role.externalUnit ?? "External"}</span>
          <span>· {role.level}</span>
          {(role.establishmentRank || role.establishmentVocation) && (
            <span>
              ·{" "}
              {[role.establishmentRank, role.establishmentVocation]
                .filter(Boolean)
                .join("/")}
            </span>
          )}
          {role.isExternal && <span>· External</span>}
          {role.specialisation && <span>· {role.specialisation}</span>}
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="surface-card p-5">
            <div className="overline mb-3">Incumbent timeline</div>
            <PostingTimeline postings={postings} mode="role" />
          </section>

          <section className="surface-card p-5">
            <div className="overline mb-3">Who is coming in next?</div>
            {future.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] italic">
                No planned or candidate incumbents yet. Add one from the admin page.
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
                        href={`/individuals/${p.individual.id}`}
                        className="font-medium hover:underline text-[var(--raid-blue-deep)]"
                      >
                        {p.individual.name}
                      </Link>
                      {p.individual.rank && (
                        <span className="text-[var(--muted-foreground)]">
                          {" "}
                          · {p.individual.rank}
                        </span>
                      )}
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
              <div className="overline mb-3">Past incumbents</div>
              <ul className="space-y-2 text-sm">
                {past.map((p) => (
                  <li key={p.id} className="flex items-start gap-3">
                    <StatusBadge status={p.status} />
                    <div className="flex-1">
                      <Link
                        href={`/individuals/${p.individual.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.individual.name}
                      </Link>
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
            <p className="chrome-mono text-[10.5px] text-[var(--muted-foreground)] mb-3 leading-snug">
              Highlighted:{" "}
              <span className="text-[var(--foreground)] font-medium">
                {role.title}
              </span>{" "}
              · {role.unit?.name ?? role.externalUnit ?? "External"}
            </p>
            <OrgChart
              tree={tree}
              incumbents={incumbents}
              highlightRoleId={role.id}
              highlightUnitId={role.unit?.id}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
