export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllIndividuals, getAllPostings } from "@/lib/queries";

export default async function IndividualsPage() {
  const [individuals, postings] = await Promise.all([
    getAllIndividuals(),
    getAllPostings(),
  ]);

  // Build per-individual current role + counts of future pairings.
  const currentByIndividual = new Map<
    number,
    { roleTitle: string; unitName: string }
  >();
  const futureCountByIndividual = new Map<number, number>();
  for (const p of postings) {
    if (p.status === "Current") {
      currentByIndividual.set(p.individualId, {
        roleTitle: p.role.title,
        unitName: p.role.unit.name,
      });
    }
    if (p.status === "Planned" || p.status === "Candidate") {
      futureCountByIndividual.set(
        p.individualId,
        (futureCountByIndividual.get(p.individualId) ?? 0) + 1,
      );
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Individuals</h1>
        <p className="text-sm text-muted-foreground">
          {individuals.length} people. Click a name to see their movement
          timeline.
        </p>
      </header>

      <div className="border rounded-lg bg-white dark:bg-neutral-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Specialisation</TableHead>
              <TableHead>Current role</TableHead>
              <TableHead className="text-right">Planned / Candidate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {individuals.map((i) => {
              const cur = currentByIndividual.get(i.id);
              const future = futureCountByIndividual.get(i.id) ?? 0;
              return (
                <TableRow key={i.id}>
                  <TableCell>
                    <Link
                      href={`/individuals/${i.id}`}
                      className="font-medium hover:underline"
                    >
                      {i.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {i.rank ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {i.specialisation ?? "—"}
                  </TableCell>
                  <TableCell>
                    {cur ? (
                      <span>
                        {cur.roleTitle}{" "}
                        <span className="text-muted-foreground">
                          ({cur.unitName})
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {future || (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
