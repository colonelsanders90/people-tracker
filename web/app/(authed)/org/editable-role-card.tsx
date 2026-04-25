"use client";

import { useState } from "react";
import Link from "next/link";
import {
  updateRole,
  deleteRole,
  toggleRoleVacancy,
  createPosting,
} from "@/app/actions";

type IndividualOption = {
  id: number;
  name: string;
  rank: string | null;
  isExternal: boolean;
};

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
  individuals: IndividualOption[];
};

export function EditableRoleCard({
  role,
  incumbent,
  pending,
  isAdmin,
  individuals,
}: Props) {
  const [mode, setMode] = useState<"display" | "edit" | "assign">("display");

  const wrapperClass = `group rounded-md px-3 py-2 ${
    role.isHead ? "bg-[var(--raid-blue-deep)]/[0.04]" : "bg-black/[0.02]"
  }`;

  if (mode === "edit") {
    return (
      <div className={wrapperClass}>
        <form
          action={async (fd) => {
            try {
              await updateRole(fd);
              setMode("display");
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
                onClick={() => setMode("display")}
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
      </div>

      {mode === "assign" && (
        <AssignForm
          role={role}
          individuals={individuals}
          onClose={() => setMode("display")}
        />
      )}

      {/* Admin row — always visible for admins */}
      {isAdmin && mode === "display" && (
        <div className="mt-2 -mx-1 flex flex-wrap items-center gap-1 pt-2 border-t border-dashed border-black/[0.06]">
          <button
            onClick={() => setMode("assign")}
            className="chrome-mono text-[10px] px-2 py-1 rounded bg-[var(--raid-blue)]/10 text-[var(--raid-blue-deep)] hover:bg-[var(--raid-blue)]/20 transition font-semibold"
            title="Assign a person to this role"
          >
            + Assign
          </button>
          <button
            onClick={() => setMode("edit")}
            className="chrome-mono text-[10px] px-2 py-1 rounded text-[var(--raid-blue-deep)] hover:bg-[var(--raid-blue)]/10 transition"
            title="Rename / edit role"
          >
            Edit
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
              className="chrome-mono text-[10px] px-2 py-1 rounded text-[var(--muted-foreground)] hover:bg-black/[0.04] transition"
              title={role.isVacant ? "Mark filled" : "Mark vacant"}
            >
              {role.isVacant ? "Mark filled" : "Mark vacant"}
            </button>
          </form>
          <form
            action={async (fd) => {
              if (
                !confirm(`Delete role "${role.title}"? This cannot be undone.`)
              )
                return;
              const result = await deleteRole(fd);
              if (!result.ok) alert(result.error);
            }}
            className="ml-auto inline"
          >
            <input type="hidden" name="id" value={role.id} />
            <button
              type="submit"
              className="chrome-mono text-[10px] px-2 py-1 rounded text-[#B33] hover:bg-red-50 transition"
              title="Delete role"
            >
              Delete
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function AssignForm({
  role,
  individuals,
  onClose,
}: {
  role: { id: number; title: string };
  individuals: IndividualOption[];
  onClose: () => void;
}) {
  const [externalIndividual, setExternalIndividual] = useState(false);
  const [status, setStatus] = useState<
    "Candidate" | "Planned" | "Current" | "Past"
  >("Candidate");
  const showEndDate = status !== "Current";

  return (
    <form
      action={async (fd) => {
        try {
          await createPosting(fd);
          onClose();
        } catch (e) {
          alert((e as Error).message);
        }
      }}
      className="mt-3 pt-3 border-t border-dashed border-black/[0.08] space-y-2"
    >
      <input type="hidden" name="roleId" value={role.id} />

      <div className="flex items-center justify-between">
        <span className="overline">Assign to {role.title}</span>
        <label className="chrome-mono text-[10px] flex items-center gap-1.5 text-[var(--muted-foreground)] cursor-pointer">
          <input
            type="checkbox"
            name="externalIndividual"
            checked={externalIndividual}
            onChange={(e) => setExternalIndividual(e.target.checked)}
            className="accent-[var(--raid-blue)]"
          />
          Outside RAiD
        </label>
      </div>

      {externalIndividual ? (
        <div className="grid grid-cols-[1fr_100px] gap-2">
          <input
            name="externalIndividualName"
            placeholder="Full name (e.g. COL James Lim)"
            required
            className={inputClass}
          />
          <input
            name="externalIndividualRank"
            placeholder="Rank"
            className={inputClass}
          />
        </div>
      ) : (
        <select name="individualId" required className={inputClass}>
          <option value="">Select a person…</option>
          {individuals.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
              {i.rank ? ` (${i.rank})` : ""}
              {i.isExternal ? " · external" : ""}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-2">
        <select
          name="status"
          required
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as typeof status)
          }
          className={inputClass}
        >
          <option value="Candidate">Candidate</option>
          <option value="Planned">Planned</option>
          <option value="Current">Current</option>
          <option value="Past">Past</option>
        </select>
        <input
          name="startDate"
          type="date"
          required={status !== "Candidate"}
          className={inputClass}
          aria-label={status === "Past" ? "Start date" : "Posted-in date"}
        />
      </div>

      {showEndDate && (
        <div className="grid grid-cols-2 gap-2">
          <input
            name="endDate"
            type="date"
            required={status === "Past"}
            placeholder={
              status === "Past" ? "End date" : "Expected end (optional)"
            }
            className={inputClass}
          />
          <input
            name="notes"
            placeholder="Notes (optional)"
            className={inputClass}
          />
        </div>
      )}

      {!showEndDate && (
        <input
          name="notes"
          placeholder="Notes (optional)"
          className={inputClass}
        />
      )}

      <p className="chrome-mono text-[10px] text-[var(--muted-foreground)] leading-snug">
        {status === "Current"
          ? "Currently on the job — no end date needed. Switch to Past when they move out."
          : status === "Past"
            ? "Historical posting — both start and end dates required."
            : "Forward-looking. End date is optional; if blank, the timeline projects the role's standard tenure."}
      </p>

      <div className="flex gap-1 pt-1">
        <button
          type="submit"
          className="px-3 py-1.5 chrome-mono text-[11px] bg-[var(--raid-blue)] text-white rounded hover:bg-[var(--raid-blue-deep)]"
        >
          Assign
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 chrome-mono text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full border border-black/15 rounded px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:border-[var(--raid-blue)]";
