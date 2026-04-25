export const dynamic = "force-dynamic";

import {
  getAllRoles,
  getAllUnits,
  getAllPostings,
  getAllIndividuals,
} from "@/lib/queries";
import { MovementBoard, type RoleMovementRow } from "./movement-board";

const ENDING_SOON_DAYS = 365; // current postings ending within next 12 months

export default async function RolesPage() {
  const [roles, units, postings, individuals] = await Promise.all([
    getAllRoles(),
    getAllUnits(),
    getAllPostings(),
    getAllIndividuals(),
  ]);

  // Skip external roles — this page is the watchlist for RAiD's internal roles.
  const internalRoles = roles.filter((r) => !r.isExternal && r.unitId != null);

  const unitById = new Map(units.map((u) => [u.id, u]));
  const individualById = new Map(individuals.map((i) => [i.id, i]));
  const now = Date.now();
  const endingSoonCutoff = now + ENDING_SOON_DAYS * 24 * 60 * 60 * 1000;

  // Group postings by role
  const postingsByRole = new Map<number, typeof postings>();
  for (const p of postings) {
    const list = postingsByRole.get(p.roleId) ?? [];
    list.push(p);
    postingsByRole.set(p.roleId, list);
  }

  const rows: RoleMovementRow[] = internalRoles.map((r) => {
    const rolePostings = postingsByRole.get(r.id) ?? [];

    // Current incumbent
    const currentPosting = rolePostings.find((p) => p.status === "Current");
    const currentIndividual = currentPosting
      ? individualById.get(currentPosting.individualId)
      : undefined;

    // Incoming, sorted earliest startDate first (nulls last)
    const incoming = rolePostings
      .filter((p) => p.status === "Planned" || p.status === "Candidate")
      .map((p) => {
        const ind = individualById.get(p.individualId);
        return {
          id: p.id,
          status: p.status as "Planned" | "Candidate",
          individualId: p.individualId,
          individualName: ind?.name ?? "Unknown",
          startDate: p.startDate,
        };
      })
      .sort((a, b) => {
        if (a.startDate && b.startDate) {
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        }
        if (a.startDate) return -1;
        if (b.startDate) return 1;
        return 0;
      });

    const currentEndsAt = currentPosting?.endDate
      ? new Date(currentPosting.endDate).getTime()
      : null;
    const isEndingSoon =
      currentEndsAt != null &&
      currentEndsAt > now &&
      currentEndsAt < endingSoonCutoff;

    let signal: RoleMovementRow["signal"];
    if (r.isVacant || !currentPosting) {
      signal = "vacant";
    } else if (isEndingSoon) {
      signal = "ending-soon";
    } else if (incoming.length > 0) {
      signal = "incoming";
    } else {
      signal = "stable";
    }

    // Next change event for default sort: whichever happens first (out or in)
    const inAt = incoming[0]?.startDate
      ? new Date(incoming[0].startDate).getTime()
      : null;
    const nextEventAt = pickEarlier(currentEndsAt, inAt);

    const unit = r.unitId == null ? null : unitById.get(r.unitId);

    return {
      id: r.id,
      title: r.title,
      level: r.level,
      unitId: r.unitId,
      unitName: unit?.name ?? r.externalUnit ?? "—",
      isVacant: r.isVacant,
      isHead: r.isHead,
      current:
        currentPosting && currentIndividual
          ? {
              id: currentPosting.id,
              individualId: currentIndividual.id,
              individualName: currentIndividual.name,
              rank: currentIndividual.rank,
              endDate: currentPosting.endDate,
            }
          : null,
      incoming,
      nextEventAt,
      signal,
    };
  });

  // Stats over the FULL set so the user knows the universe
  const totals = {
    all: rows.length,
    vacant: rows.filter((r) => r.isVacant || r.signal === "vacant").length,
    endingSoon: rows.filter((r) => r.signal === "ending-soon").length,
    incoming: rows.reduce((acc, r) => acc + r.incoming.length, 0),
  };

  return (
    <div className="space-y-6">
      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Movement watchlist</div>
        <h1 className="text-2xl mt-1">Roles in motion</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1 max-w-2xl">
          Roles where something is happening — vacancies, current incumbents
          ending soon, or candidates / planned successors queued. Use the chips
          to narrow, click a column header to sort, or flip to <em>All roles</em>{" "}
          for the wholesale list.
        </p>
      </header>

      <MovementBoard rows={rows} totals={totals} />
    </div>
  );
}

function pickEarlier(a: number | null, b: number | null): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return Math.min(a, b);
}
