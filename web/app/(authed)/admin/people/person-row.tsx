"use client";

import { useState } from "react";
import { updateIndividual, deleteIndividual } from "@/app/actions";

type Person = {
  id: number;
  name: string;
  rank: string | null;
  specialisation: string | null;
  employeeId: string | null;
  email: string | null;
  isExternal: boolean;
};

export function PersonRow({
  person,
  postingCount,
  zebra,
}: {
  person: Person;
  postingCount: number;
  zebra: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className={`border-t border-black/[0.06] ${zebra ? "bg-black/[0.015]" : ""}`}>
        <td colSpan={7} className="px-4 py-3">
          <form
            action={async (fd) => {
              try {
                await updateIndividual(fd);
                setEditing(false);
              } catch (e) {
                alert((e as Error).message);
              }
            }}
            className="grid md:grid-cols-2 gap-2"
          >
            <input type="hidden" name="id" value={person.id} />
            <Field label="Name">
              <input
                name="name"
                required
                defaultValue={person.name}
                className={inputClass}
              />
            </Field>
            <Field label="Rank">
              <input
                name="rank"
                defaultValue={person.rank ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Specialisation">
              <input
                name="specialisation"
                defaultValue={person.specialisation ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Employee ID">
              <input
                name="employeeId"
                defaultValue={person.employeeId ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                defaultValue={person.email ?? ""}
                className={inputClass}
              />
            </Field>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 chrome-mono text-[11px] bg-[var(--raid-blue)] text-white rounded hover:bg-[var(--raid-blue-deep)]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 chrome-mono text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={`border-t border-black/[0.06] ${zebra ? "bg-black/[0.015]" : ""}`}
    >
      <Td>{person.name}</Td>
      <Td muted>{person.rank ?? "—"}</Td>
      <Td muted>{person.specialisation ?? "—"}</Td>
      <Td muted>
        <span className="chrome-mono text-[11px]">
          {person.employeeId ?? "—"}
        </span>
      </Td>
      <Td muted>
        <span className="chrome-mono text-[11px]">
          {person.isExternal ? "external" : "internal"}
        </span>
      </Td>
      <Td align="right">
        <span className="chrome-mono tabular-nums">{postingCount}</span>
      </Td>
      <Td align="right">
        <div className="inline-flex gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center px-2.5 py-1 chrome-mono text-[11px] text-[var(--raid-blue-deep)] hover:bg-[var(--raid-blue)]/10 rounded transition"
          >
            Edit
          </button>
          <form
            action={async (fd) => {
              if (
                !confirm(
                  `Delete ${person.name}? ${
                    postingCount > 0
                      ? `Has ${postingCount} posting(s) — server will refuse.`
                      : "This cannot be undone."
                  }`,
                )
              )
                return;
              try {
                await deleteIndividual(fd);
              } catch (e) {
                alert((e as Error).message);
              }
            }}
            className="inline"
          >
            <input type="hidden" name="id" value={person.id} />
            <button
              type="submit"
              className="inline-flex items-center px-2.5 py-1 chrome-mono text-[11px] text-[#B33] hover:bg-red-50 rounded transition"
              title={
                postingCount > 0
                  ? `Has ${postingCount} posting${postingCount === 1 ? "" : "s"} — delete those first`
                  : "Delete"
              }
            >
              Delete
            </button>
          </form>
        </div>
      </Td>
    </tr>
  );
}

const inputClass =
  "w-full border border-black/15 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[var(--raid-blue)]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="overline">{label}</label>
      {children}
    </div>
  );
}

function Td({
  children,
  align,
  muted,
}: {
  children: React.ReactNode;
  align?: "right";
  muted?: boolean;
}) {
  return (
    <td
      className={`px-4 py-2.5 ${align === "right" ? "text-right" : ""} ${
        muted ? "text-[var(--muted-foreground)]" : ""
      }`}
    >
      {children}
    </td>
  );
}
