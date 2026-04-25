export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAllIndividuals, getAllPostings } from "@/lib/queries";

export default async function IndividualsPage() {
  const [individuals, postings] = await Promise.all([
    getAllIndividuals(),
    getAllPostings(),
  ]);

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
    <div className="space-y-6">
      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Individuals</div>
        <h1 className="text-2xl mt-1">Individuals</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {individuals.length} people. Click a name to see the movement timeline and
          where they might go next.
        </p>
      </header>

      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--raid-blue-deep)] text-white">
              <Th>Name</Th>
              <Th>Current role</Th>
              <Th align="right">Possible next roles</Th>
            </tr>
          </thead>
          <tbody>
            {individuals.map((i, idx) => {
              const cur = currentByIndividual.get(i.id);
              const future = futureCountByIndividual.get(i.id) ?? 0;
              return (
                <tr
                  key={i.id}
                  className={`border-t border-black/[0.06] hover:bg-[#f5f8fc] transition ${
                    idx % 2 === 1 ? "bg-black/[0.015]" : ""
                  }`}
                >
                  <Td>
                    <Link
                      href={`/individuals/${i.id}`}
                      className="font-medium hover:underline text-[var(--raid-blue-deep)]"
                    >
                      {i.name}
                    </Link>
                  </Td>
                  <Td>
                    {cur ? (
                      <>
                        {cur.roleTitle}{" "}
                        <span className="text-[var(--muted-foreground)]">
                          · {cur.unitName}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                        None
                      </span>
                    )}
                  </Td>
                  <Td align="right">
                    <span className="chrome-mono tabular-nums">{future}</span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
