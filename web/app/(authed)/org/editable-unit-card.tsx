"use client";

import { useState } from "react";
import { renameUnit, deleteUnit, createRole } from "@/app/actions";
import { EditableRoleCard } from "./editable-role-card";

type RoleSummary = {
  id: number;
  title: string;
  isHead: boolean;
  isVacant: boolean;
  specialisation: string | null;
  establishmentRank: string | null;
  establishmentVocation: string | null;
};

type IndividualOption = {
  id: number;
  name: string;
  rank: string | null;
  isExternal: boolean;
};

type Props = {
  unit: {
    id: number;
    name: string;
    code: string | null;
    level: "L1" | "L2" | "L3";
  };
  roles: RoleSummary[];
  incumbents: Map<
    number,
    { id: number; name: string; rank: string | null }
  >;
  pendingByRole: Map<number, number>;
  tone: "L1" | "L2";
  maxWidth?: number;
  isAdmin: boolean;
  individuals: IndividualOption[];
};

export function EditableUnitCard({
  unit,
  roles,
  incumbents,
  pendingByRole,
  tone,
  maxWidth,
  isAdmin,
  individuals,
}: Props) {
  const [renaming, setRenaming] = useState(false);
  const [adding, setAdding] = useState(false);

  const head = roles.find((r) => r.isHead);
  const staff = roles.filter((r) => !r.isHead);
  const filled = roles.filter((r) => incumbents.has(r.id)).length;

  const headerBg =
    tone === "L1" ? "var(--raid-blue-deep)" : "var(--raid-blue)";

  return (
    <div
      className="surface-card overflow-hidden flex flex-col"
      style={{
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        width: "100%",
      }}
    >
      <div
        className="px-4 py-3 text-white flex-shrink-0"
        style={{ background: headerBg }}
      >
        {renaming ? (
          <form
            action={async (fd) => {
              try {
                await renameUnit(fd);
                setRenaming(false);
              } catch (e) {
                alert((e as Error).message);
              }
            }}
            className="flex flex-wrap gap-2 items-center"
          >
            <input type="hidden" name="id" value={unit.id} />
            <span className="overline-on-dark">{unit.level}</span>
            <input
              name="name"
              defaultValue={unit.name}
              required
              autoFocus
              className="flex-1 px-2 py-1 text-sm bg-white/10 border border-white/30 rounded text-white placeholder-white/40 focus:outline-none focus:border-[var(--raid-blue-light)] min-w-[100px]"
            />
            <button
              type="submit"
              className="chrome-mono text-[10px] bg-white text-[var(--raid-blue-deep)] px-2 py-1 rounded"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setRenaming(false)}
              className="chrome-mono text-[10px] text-white/70 hover:text-white"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="overline-on-dark">{unit.level}</span>
            <h3 className="font-semibold text-[15px] tracking-tight truncate">
              {unit.name}
            </h3>
            {unit.code && (
              <span className="chrome-mono text-white/65 text-[11px] hidden sm:inline">
                {unit.code}
              </span>
            )}
            {isAdmin && tone === "L2" && (
              <span className="ml-auto flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setRenaming(true)}
                  className="chrome-mono text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition"
                  title="Rename branch"
                >
                  Edit
                </button>
                <form
                  action={async (fd) => {
                    if (
                      !confirm(
                        `Delete branch "${unit.name}"? Its roles must be removed first.`,
                      )
                    )
                      return;
                    const result = await deleteUnit(fd);
                    if (!result.ok) alert(result.error);
                  }}
                  className="inline"
                >
                  <input type="hidden" name="id" value={unit.id} />
                  <button
                    type="submit"
                    className="chrome-mono text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-[var(--raid-coral)] text-white transition"
                    title="Delete branch"
                  >
                    ×
                  </button>
                </form>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {head && (
          <EditableRoleCard
            role={head}
            incumbent={incumbents.get(head.id)}
            pending={pendingByRole.get(head.id) ?? 0}
            isAdmin={isAdmin}
            individuals={individuals}
          />
        )}

        {staff.length > 0 && (
          <ul className="space-y-1.5">
            {staff.map((r) => (
              <li key={r.id}>
                <EditableRoleCard
                  role={r}
                  incumbent={incumbents.get(r.id)}
                  pending={pendingByRole.get(r.id) ?? 0}
                  isAdmin={isAdmin}
                  individuals={individuals}
                />
              </li>
            ))}
          </ul>
        )}

        {roles.length === 0 && (
          <p className="font-mono-brand text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
            No roles defined
          </p>
        )}

        {/* Add role inline form */}
        {isAdmin && adding && (
          <form
            action={async (fd) => {
              const result = await createRole(fd);
              if (!result.ok) {
                alert(result.error);
                return;
              }
              setAdding(false);
            }}
            className="space-y-2 pt-2 border-t border-black/[0.06]"
          >
            <input type="hidden" name="unitId" value={unit.id} />
            {/* The server snaps level to the unit's level when isHead is
                ticked, so this is just the default for non-head roles. */}
            <input
              type="hidden"
              name="level"
              value={tone === "L1" ? "L1" : "L3"}
            />
            <input
              name="title"
              required
              autoFocus
              placeholder="Role title (e.g. Software Engineer)"
              className="w-full border border-black/15 rounded px-2 py-1.5 text-[13px] bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="establishmentRank"
                placeholder="Rank (e.g. LTC, ME6)"
                className="border border-black/15 rounded px-2 py-1 bg-white text-[12px]"
              />
              <input
                name="establishmentVocation"
                placeholder="Vocation (e.g. AAO, AFE)"
                className="border border-black/15 rounded px-2 py-1 bg-white text-[12px]"
              />
            </div>
            <input
              name="specialisation"
              placeholder="Specialisation (free text, optional)"
              className="w-full border border-black/15 rounded px-2 py-1 bg-white text-[12px]"
            />
            <div className="flex flex-wrap items-center gap-3 chrome-mono text-[11px] text-[var(--muted-foreground)]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="isHead"
                  className="accent-[var(--raid-blue)]"
                />
                Head role
              </label>
              <span className="text-[10px] opacity-70">
                Head roles auto-set level to the {tone === "L1" ? "L1" : "L2"}{" "}
                of this unit and replace any existing head.
              </span>
            </div>
            <div className="flex gap-1">
              <button
                type="submit"
                className="px-3 py-1.5 chrome-mono text-[11px] bg-[var(--raid-blue)] text-white rounded hover:bg-[var(--raid-blue-deep)]"
              >
                Add role
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="px-3 py-1.5 chrome-mono text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Footer: stats + + Role button (admin only) */}
        <div className="mt-auto pt-3 border-t border-black/[0.06] flex items-center gap-2 chrome-mono text-[11px]">
          <span className="text-[var(--muted-foreground)]">Filled</span>
          <span className="tabular-nums font-semibold">
            {filled}/{roles.length}
          </span>
          {roles.some((r) => r.isVacant) && (
            <span style={{ color: "var(--raid-coral)" }}>● Vacancy</span>
          )}
          {isAdmin && !adding && (
            <button
              onClick={() => setAdding(true)}
              className="ml-auto chrome-mono text-[11px] px-3 py-1 rounded bg-[var(--raid-blue)]/10 text-[var(--raid-blue-deep)] hover:bg-[var(--raid-blue)]/20 transition font-semibold"
            >
              + Add role
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
