export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAllUnits,
  getAllRoles,
  getAllIndividuals,
  getAllPostings,
} from "@/lib/queries";

export default async function Home() {
  const [units, roles, individuals, postings] = await Promise.all([
    getAllUnits(),
    getAllRoles(),
    getAllIndividuals(),
    getAllPostings(),
  ]);

  const counts = {
    units: units.length,
    roles: roles.length,
    individuals: individuals.length,
    current: postings.filter((p) => p.status === "Current").length,
    planned: postings.filter((p) => p.status === "Planned").length,
    candidate: postings.filter((p) => p.status === "Candidate").length,
    vacant: roles.filter((r) => r.isVacant).length,
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">RAiD Manpower Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pick a lens — view movements by individual, or by role.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/individuals" className="group">
          <Card className="group-hover:border-foreground/40 transition">
            <CardHeader>
              <CardTitle>By individual →</CardTitle>
              <CardDescription>
                Pick a person to see their posting history, current role, and
                where they might move next.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {counts.individuals} people tracked
            </CardContent>
          </Card>
        </Link>

        <Link href="/roles" className="group">
          <Card className="group-hover:border-foreground/40 transition">
            <CardHeader>
              <CardTitle>By role →</CardTitle>
              <CardDescription>
                Pick a role to see past and current incumbents, and who might
                come in next.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {counts.roles} roles across {counts.units} units · {counts.vacant}{" "}
              vacant
            </CardContent>
          </Card>
        </Link>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          At a glance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Current postings" value={counts.current} />
          <Stat label="Planned moves" value={counts.planned} />
          <Stat label="Candidate pairings" value={counts.candidate} />
          <Stat label="Vacant roles" value={counts.vacant} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-neutral-900">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
