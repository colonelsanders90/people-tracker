"use client";

import { useState } from "react";
import Link from "next/link";
import {
  updateRole,
  deleteRole,
  toggleRoleVacancy,
} from "@/app/actions";

type Props = {
  role: {
    id: number;
    title: string;
    isHead: boolean;
    isVacant: boolean;
    specialisation: string | null;
  };
  incumbent: { id: number; name: string; rank: string | null } | undefined;
  pending: number;
  isAdmin: boolean;
};

export function EditableRoleCard({ role, incumbent, pending, isAdmin }: Props) {
  const [editing, setEditing] = useState(false);

  const wrapperClass = `rounded-md px-3 py-2 ${
    role.isHead ? "bg-[var(--raid-blue-deep)]/[0.04]" : "bg-black/[0.02]"
  }`;

  if (editing) {
    return (
      <div className={wrapperClass}>
        <form
          action={async (fd) => {
            try {
              await updateRole(fd);
              setEditing(false);
            } catch (e) {
              alert((e as Error).message);
            }
          }}
          className="space-y-2"
        >
          <input type="hidden" name="id" value={role.id} />
          <input
            name="title"
            defaultValue={role.title}
            required
            className="w-full border border-black/15 rounded px-2 py-1 text-[13px] bg-white"
          />
          <div className="flex flex-wrap items-center gap-3 chrome-mono text-[11px] text-[var(--muted-foreground)]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                name="isHead"
                defaultChecked={role.isHead}
                className="accent-[var(--raid-blue)]"
              />
              Branch head
            </label>
            <input
              name="specialisation"
              defaultValue={role.specialisation ?? ""}
              placeholder="Specialisation"
              className="border border-black/15 rounded px-2 py-1 bg-white text-[var(--foreground)] text-[12px] flex-1 min-w-[100px]"
            />
            <div className="ml-auto flex gap-1">
              <button
                type="submit"
                className="px-2 py-1 chrome-mono text-[10px] bg-[var(--raid-blue)] text-white rounded hover:bg-[var(--raid-blue-deep)]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-2 py-1 chrome-mono text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div className="flex items-baseline gap-2">
        <Link
          href={`/roles/${role.id}`}
          className={`hover:underline text-[13px] ${
            role.isHead
              ? "font-semibold text-[var(--raid-blue-deep)]"
              : "font-medium"
          }`}
        >
          {role.title}
        </Link>
        {role.isVacant && (
          <span className="overline" style={{ color: "var(--raid-coral)" }}>
            Vacant
          </span>
        )}
        {pending > 0 && (
          <span
            className="ml-auto chrome-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: "var(--raid-status-blue-bg)",
              color: "var(--raid-status-blue-text)",
            }}
            title="Planned + Candidate postings"
          >
            +{pending} pending
          </span>
        )}
      </div>
      <div className="mt-1 text-[12.5px] flex items-baseline gap-2">
        {incumbent ? (
          <Link
            href={`/individuals/${incumbent.id}`}
            className="hover:underline text-[var(--foreground)]"
          >
            {incumbent.name}
            {incumbent.rank && (
              <span className="text-[var(--muted-foreground)]">
                {" "}
                · {incumbent.rank}
              </span>
            )}
          </Link>
        ) : (
          <span className="font-mono-brand text-[10.5px] uppercase tracking-wider text-[var(--muted-foreground)]">
            Unfilled
          </span>
        )}
        {isAdmin && (
          <span className="ml-auto flex gap-0.5">
            <button
              onClick={() => setEditing(true)}
              className="chrome-mono text-[10px] text-[var(--muted-foreground)] hover:text-[var(--raid-blue-deep)] px-1.5"
              title="Rename / edit"
            >
              edit
            </button>
            <form action={toggleRoleVacancy} className="inline">
              <input type="hidden" name="id" value={role.id} />
              <input
                type="hidden"
                name="isVacant"
                value={String(role.isVacant)}
              />
              <button
                type="submit"
                className="chrome-mono text-[10px] text-[var(--muted-foreground)] hover:text-[var(--raid-blue-deep)] px-1.5"
                title={role.isVacant ? "Mark filled" : "Mark vacant"}
              >
                {role.isVacant ? "fill" : "vacate"}
              </button>
            </form>
            <form
              action={async (fd) => {
                if (
                  !confirm(`Delete role "${role.title}"? This cannot be undone.`)
                )
                  return;
                try {
                  await deleteRole(fd);
                } catch (e) {
                  alert((e as Error).message);
                }
              }}
              className="inline"
            >
              <input type="hidden" name="id" value={role.id} />
              <button
                type="submit"
                className="chrome-mono text-[10px] text-[#B33] hover:text-[#811] px-1.5"
                title="Delete role"
              >
                ×
              </button>
            </form>
          </span>
        )}
      </div>
    </div>
  );
}
