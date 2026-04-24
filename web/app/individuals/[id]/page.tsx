import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
      <header className="flex items-baseline gap-3 flex-wrap">
        <Link
          href="/individuals"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Individuals
        </Link>
        <h1 className="text-2xl font-semibold">{individual.name}</h1>
        {individual.rank && (
          <span className="text-sm text-muted-foreground">
            {individual.rank}
          </span>
        )}
        {individual.specialisation && (
          <span className="text-sm text-muted-foreground">
            · {individual.specialisation}
          </span>
        )}
      </header>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Movement timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <PostingTimeline postings={postings} mode="individual" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Where next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {future.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No planned or candidate postings yet. Add one from the admin
                  page.
                </p>
              )}
              {future.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 text-sm border rounded-md p-3"
                >
                  <StatusBadge status={p.status} />
                  <div className="flex-1">
                    <Link
                      href={`/roles/${p.role.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.role.title}
                    </Link>
                    <span className="text-muted-foreground">
                      {" "}
                      · {p.role.unit.name} · {p.role.level}
                    </span>
                    {(p.startDate || p.endDate) && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.startDate ?? "?"} → {p.endDate ?? "?"}
                      </div>
                    )}
                    {p.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {past.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Past postings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {past.map((p) => (
                  <div key={p.id} className="flex items-start gap-3">
                    <StatusBadge status={p.status} />
                    <div className="flex-1">
                      <Link
                        href={`/roles/${p.role.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.role.title}
                      </Link>
                      <span className="text-muted-foreground">
                        {" "}
                        · {p.role.unit.name}
                      </span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {p.startDate} → {p.endDate}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Org chart</CardTitle>
            </CardHeader>
            <CardContent>
              {current && (
                <p className="text-xs text-muted-foreground mb-3">
                  Highlighted: currently{" "}
                  <span className="font-medium">{current.role.title}</span> in{" "}
                  {current.role.unit.name}.
                </p>
              )}
              <Separator className="mb-3" />
              <OrgChart
                tree={tree}
                incumbents={incumbents}
                highlightRoleId={current?.role.id}
                highlightUnitId={current?.role.unit.id}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
