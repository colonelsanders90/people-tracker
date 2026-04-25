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
};

export function EditableUnitCard({
  unit,
  roles,
  incumbents,
  pendingByRole,
  tone,
  maxWidth,
  isAdmin,
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
      className="surface-card overflow-hidden"
      style={{
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        width: "100%",
      }}
    >
      <div
        className="px-4 py-3 text-white"
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
            className="flex gap-2 items-center"
          >
            <input type="hidden" name="id" value={unit.id} />
            <span className="overline-on-dark">{unit.level}</span>
            <input
              name="name"
              defaultValue={unit.name}
              required
              autoFocus
              className="flex-1 px-2 py-1 text-sm bg-white/10 border border-white/30 rounded text-white placeholder-white/40 focus:outline-none focus:border-[var(--raid-blue-light)]"
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
            <h3 className="font-semibold text-[15px] tracking-tight">
              {unit.name}
            </h3>
            {unit.code && (
              <span className="chrome-mono text-white/65 text-[11px]">
                {unit.code}
              </span>
            )}
            {isAdmin && tone === "L2" && (
              <span className="ml-auto flex gap-1">
                <button
                  onClick={() => setRenaming(true)}
                  className="chrome-mono text-[10px] text-white/70 hover:text-white"
                  title="Rename branch"
                >
                  edit
                </button>
                <form
                  action={async (fd) => {
                    if (
                      !confirm(
                        `Delete branch "${unit.name}"? Roles must be removed first.`,
                      )
                    )
                      return;
                    try {
                      await deleteUnit(fd);
                    } catch (e) {
                      alert((e as Error).message);
                    }
                  }}
                  className="inline"
                >
                  <input type="hidden" name="id" value={unit.id} />
                  <button
                    type="submit"
                    className="chrome-mono text-[10px] text-white/70 hover:text-[var(--raid-coral)]"
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

      <div className="p-4 space-y-3">
        {head && (
          <EditableRoleCard
            role={head}
            incumbent={incumbents.get(head.id)}
            pending={pendingByRole.get(head.id) ?? 0}
            isAdmin={isAdmin}
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

        {/* Add role */}
        {isAdmin && adding && (
          <form
            action={async (fd) => {
              try {
                await createRole(fd);
                setAdding(false);
              } catch (e) {
                alert((e as Error).message);
              }
            }}
            className="space-y-2 pt-2 border-t border-black/[0.06]"
          >
            <input type="hidden" name="unitId" value={unit.id} />
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
            <div className="flex flex-wrap items-center gap-3 chrome-mono text-[11px] text-[var(--muted-foreground)]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="isHead"
                  className="accent-[var(--raid-blue)]"
                />
                Branch head
              </label>
              <input
                name="specialisation"
                placeholder="Specialisation"
                className="border border-black/15 rounded px-2 py-1 bg-white text-[var(--foreground)] text-[12px] flex-1 min-w-[100px]"
              />
              <div className="ml-auto flex gap-1">
                <button
                  type="submit"
                  className="px-2 py-1 chrome-mono text-[10px] bg-[var(--raid-blue)] text-white rounded hover:bg-[var(--raid-blue-deep)]"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="px-2 py-1 chrome-mono text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-black/[0.06] flex items-center gap-2 chrome-mono text-[11px]">
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
              className="ml-auto chrome-mono text-[11px] text-[var(--raid-blue-deep)] hover:bg-[var(--raid-blue)]/10 px-2 py-0.5 rounded"
            >
              + Role
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
