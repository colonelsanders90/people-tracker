export const dynamic = "force-dynamic";

import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { getAllIndividuals, getAllPostings } from "@/lib/queries";
import type { PostingWithRelations } from "@/lib/queries";

export default async function IndividualsPage() {
  const [individuals, postings] = await Promise.all([
    getAllIndividuals(),
    getAllPostings(),
  ]);

  const currentByIndividual = new Map<
    number,
    { roleId: number; roleTitle: string; unitName: string }
  >();
  const futureByIndividual = new Map<number, PostingWithRelations[]>();
  for (const p of postings) {
    if (p.status === "Current") {
      currentByIndividual.set(p.individualId, {
        roleId: p.role.id,
        roleTitle: p.role.title,
        unitName: p.role.unit?.name ?? p.role.externalUnit ?? "External",
      });
    }
    if (p.status === "Planned" || p.status === "Candidate") {
      const list = futureByIndividual.get(p.individualId) ?? [];
      list.push(p);
      futureByIndividual.set(p.individualId, list);
    }
  }

  return (
    <div className="space-y-6">
      <header className="accent-strip pl-5 py-1">
        <div className="overline">Manpower · Individuals</div>
        <h1 className="text-2xl mt-1">Individuals</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {individuals.length} people. Click a name to see the movement timeline
          and where they might go next.
        </p>
      </header>

      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--raid-blue-deep)] text-white">
              <Th>Name</Th>
              <Th>Current role</Th>
              <Th>Possible next roles</Th>
            </tr>
          </thead>
          <tbody>
            {individuals.map((i, idx) => {
              const cur = currentByIndividual.get(i.id);
              const future = futureByIndividual.get(i.id) ?? [];
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
                    {i.isExternal && (
                      <span className="ml-2 chrome-mono text-[10px] text-[var(--muted-foreground)]">
                        external
                      </span>
                    )}
                  </Td>
                  <Td>
                    {cur ? (
                      <Link
                        href={`/roles/${cur.roleId}`}
                        className="hover:underline"
                      >
                        {cur.roleTitle}{" "}
                        <span className="text-[var(--muted-foreground)]">
                          · {cur.unitName}
                        </span>
                      </Link>
                    ) : (
                      <span className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                        None
                      </span>
                    )}
                  </Td>
                  <Td>
                    {future.length === 0 ? (
                      <span className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                        —
                      </span>
                    ) : (
                      <ul className="space-y-1">
                        {future.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center gap-2 leading-snug"
                          >
                            <StatusBadge status={p.status} />
                            <Link
                              href={`/roles/${p.role.id}`}
                              className="hover:underline"
                            >
                              {p.role.title}
                              <span className="text-[var(--muted-foreground)]">
                                {" "}
                                ·{" "}
                                {p.role.unit?.name ??
                                  p.role.externalUnit ??
                                  "External"}
                              </span>
                            </Link>
                            {p.startDate && (
                              <span className="chrome-mono text-[10px] text-[var(--muted-foreground)]">
                                {p.startDate}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 chrome-mono text-white/85 text-[11px] font-medium tracking-wider text-left">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
