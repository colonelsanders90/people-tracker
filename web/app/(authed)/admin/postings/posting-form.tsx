"use client";

import { useState } from "react";

type IndividualOption = { id: number; name: string; rank: string | null };
type RoleOption = {
  id: number;
  title: string;
  level: string;
  unitName: string;
};

export function PostingForm({
  action,
  individuals,
  roles,
}: {
  action: (formData: FormData) => Promise<void>;
  individuals: IndividualOption[];
  roles: RoleOption[];
}) {
  const [externalIndividual, setExternalIndividual] = useState(false);
  const [externalRole, setExternalRole] = useState(false);
  const [status, setStatus] = useState<
    "Candidate" | "Planned" | "Current" | "Past"
  >("Candidate");
  const showEndDate = status !== "Current";

  return (
    <form action={action} className="grid md:grid-cols-2 gap-4">
      {/* Individual */}
      <div className="space-y-1.5 md:col-span-2">
        <div className="flex items-center justify-between">
          <label className="overline">Individual</label>
          <label className="chrome-mono text-[11px] flex items-center gap-1.5 text-[var(--muted-foreground)] cursor-pointer">
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
          <div className="grid sm:grid-cols-[1fr_140px] gap-2">
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
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Role */}
      <div className="space-y-1.5 md:col-span-2">
        <div className="flex items-center justify-between">
          <label className="overline">Role</label>
          <label className="chrome-mono text-[11px] flex items-center gap-1.5 text-[var(--muted-foreground)] cursor-pointer">
            <input
              type="checkbox"
              name="externalRole"
              checked={externalRole}
              onChange={(e) => setExternalRole(e.target.checked)}
              className="accent-[var(--raid-blue)]"
            />
            Outside RAiD
          </label>
        </div>
        {externalRole ? (
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              name="externalRoleTitle"
              placeholder="Role title (e.g. Hd Cloud Plans)"
              required
              className={inputClass}
            />
            <input
              name="externalRoleUnit"
              placeholder="Sub-unit (e.g. DPLD, X AELG, APD)"
              required
              className={inputClass}
            />
          </div>
        ) : (
          <select name="roleId" required className={inputClass}>
            <option value="">Select a role…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} — {r.unitName} ({r.level})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <label htmlFor="status" className="overline">
          Status
        </label>
        <select
          id="status"
          name="status"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className={inputClass}
        >
          <option value="Candidate">Candidate</option>
          <option value="Planned">Planned</option>
          <option value="Current">Current</option>
          <option value="Past">Past</option>
        </select>
      </div>

      <div className="md:col-span-1" />

      <div className="space-y-1.5">
        <label htmlFor="startDate" className="overline">
          {status === "Past" ? "Start date" : "Posted-in date"}
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          required={status !== "Candidate"}
          className={inputClass}
        />
      </div>

      {showEndDate ? (
        <div className="space-y-1.5">
          <label htmlFor="endDate" className="overline">
            End date{" "}
            <span className="text-[var(--muted-foreground)] normal-case tracking-normal">
              {status === "Past" ? "(required)" : "(optional)"}
            </span>
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required={status === "Past"}
            className={inputClass}
          />
        </div>
      ) : (
        <div className="space-y-1.5 flex flex-col justify-end">
          <p className="chrome-mono text-[10px] text-[var(--muted-foreground)] leading-snug pb-2">
            Currently on the job — no end date needed. Switch the status to
            Past when they move out.
          </p>
        </div>
      )}

      <div className="space-y-1.5 md:col-span-2">
        <label htmlFor="notes" className="overline">
          Notes
        </label>
        <input
          id="notes"
          name="notes"
          placeholder="Optional context"
          className={inputClass}
        />
      </div>

      <div className="md:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 rounded-md bg-[var(--raid-blue)] hover:bg-[var(--raid-blue-deep)] text-white text-sm font-medium transition active:scale-[0.98]"
        >
          Add posting
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full border border-black/15 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--raid-blue)] focus:ring-2 focus:ring-[var(--raid-blue)]/20 transition";
