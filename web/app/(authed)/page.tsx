export const dynamic = "force-dynamic";

import Link from "next/link";
import { RAiD } from "@/components/raid";
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
    <div className="space-y-10">
      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Dashboard</div>
        <h1 className="text-3xl mt-1">
          <RAiD /> Manpower Tracker
        </h1>
        <p className="text-[15px] text-[var(--muted-foreground)] mt-1 max-w-2xl">
          A movement ledger for <RAiD />ers. Track who is moving where next, and who is
          coming in next — across <RAiD /> HQ and its branches.
        </p>
      </header>

      <section>
        <div className="overline mb-3">Pick a lens</div>
        <div className="grid md:grid-cols-3 gap-4">
          <LensCard
            href="/org"
            title="By organisation"
            blurb="See the whole tree. Heads, branches, who fills which role, where the gaps are."
            stat={`${counts.units} units · ${counts.vacant} vacant`}
            primary
          />
          <LensCard
            href="/individuals"
            title="By individual"
            blurb="Pick a person to see their posting history, current role, and where they might move next."
            stat={`${counts.individuals} people tracked`}
          />
          <LensCard
            href="/roles"
            title="By role"
            blurb="Pick a role to see past and current incumbents, plus who is queued to come in."
            stat={`${counts.roles} roles`}
          />
        </div>
      </section>

      <section>
        <div className="overline mb-3">At a glance</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Current postings" value={counts.current} />
          <Stat label="Planned moves" value={counts.planned} />
          <Stat label="Candidate pairings" value={counts.candidate} />
          <Stat label="Vacant roles" value={counts.vacant} accent={counts.vacant > 0} />
        </div>
      </section>
    </div>
  );
}

function LensCard({
  href,
  title,
  blurb,
  stat,
  primary,
}: {
  href: string;
  title: string;
  blurb: string;
  stat: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group surface-card block p-5 transition hover:border-[var(--raid-blue)] hover:-translate-y-[2px] ${
        primary ? "ring-1 ring-[var(--raid-blue)]/30" : ""
      }`}
    >
      <div className="flex items-baseline gap-2">
        <h3 className="font-semibold text-[17px]">{title}</h3>
        <span className="ml-auto chrome-mono text-[var(--raid-blue)] group-hover:translate-x-0.5 transition">
          →
        </span>
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mt-2 leading-relaxed">
        {blurb}
      </p>
      <div className="overline mt-4">{stat}</div>
    </Link>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="surface-card px-4 py-3">
      <div className="overline">{label}</div>
      <div
        className="text-[28px] font-semibold tabular-nums leading-none mt-1.5"
        style={accent ? { color: "var(--raid-coral)" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
