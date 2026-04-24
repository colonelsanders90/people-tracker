import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

  const current = postings.find((p) => p.status === "Current");
  const future = postings.filter(
    (p) => p.status === "Planned" || p.status === "Candidate",
  );
  const past = postings.filter((p) => p.status === "Past");

  return (
    <div className="space-y-6">
      <header className="flex items-baseline gap-3 flex-wrap">
        <Link
          href="/roles"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Roles
        </Link>
        <h1 className="text-2xl font-semibold">{role.title}</h1>
        <span className="text-sm text-muted-foreground">
          {role.unit.name} · {role.level}
        </span>
        {role.isVacant && <Badge variant="destructive">VACANT</Badge>}
        {role.specialisation && (
          <span className="text-sm text-muted-foreground">
            · {role.specialisation}
          </span>
        )}
      </header>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Incumbent timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <PostingTimeline postings={postings} mode="role" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Who is coming in next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {future.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No planned or candidate incumbents yet. Add one from the admin
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
                      href={`/individuals/${p.individual.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.individual.name}
                    </Link>
                    {p.individual.rank && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {p.individual.rank}
                      </span>
                    )}
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
                <CardTitle>Past incumbents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {past.map((p) => (
                  <div key={p.id} className="flex items-start gap-3">
                    <StatusBadge status={p.status} />
                    <div className="flex-1">
                      <Link
                        href={`/individuals/${p.individual.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.individual.name}
                      </Link>
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
              <p className="text-xs text-muted-foreground mb-3">
                Highlighted: <span className="font-medium">{role.title}</span>{" "}
                in {role.unit.name}.
              </p>
              <Separator className="mb-3" />
              <OrgChart
                tree={tree}
                incumbents={incumbents}
                highlightRoleId={role.id}
                highlightUnitId={role.unit.id}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
