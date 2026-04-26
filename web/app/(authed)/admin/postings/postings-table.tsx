"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { SortableTable, type Column } from "@/components/sortable-table";
import { deletePosting, updatePosting } from "@/app/actions";

export type PostingRow = {
  id: number;
  status: "Past" | "Current" | "Planned" | "Candidate";
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  individualId: number;
  individualName: string;
  individualIsExternal: boolean;
  roleId: number;
  roleTitle: string;
  unitName: string;
  roleIsExternal: boolean;
};

const statusRank: Record<PostingRow["status"], number> = {
  Current: 0,
  Planned: 1,
  Candidate: 2,
  Past: 3,
};

export function PostingsTable({ rows }: { rows: PostingRow[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const columns: Column<PostingRow>[] = [
    {
      key: "status",
      header: "Status",
      sort: (r) => statusRank[r.status],
      cell: (r) =>
        editingId === r.id ? (
          <span className="font-mono-brand text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">
            Editing
          </span>
        ) : (
          <StatusBadge status={r.status} />
        ),
    },
    {
      key: "individual",
      header: "Individual",
      sort: (r) => r.individualName.toLowerCase(),
      cell: (r) => (
        <span>
          {r.individualName}
          {r.individualIsExternal && (
            <span className="ml-2 chrome-mono text-[10px] text-[var(--muted-foreground)]">
              external
            </span>
          )}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      sort: (r) => r.roleTitle.toLowerCase(),
      cell: (r) => (
        <span>
          {r.roleTitle}{" "}
          <span className="text-[var(--muted-foreground)]">
            · {r.unitName}
          </span>
          {r.roleIsExternal && (
            <span className="ml-2 chrome-mono text-[10px] text-[var(--muted-foreground)]">
              external
            </span>
          )}
        </span>
      ),
    },
    {
      key: "start",
      header: "Start",
      sort: (r) => (r.startDate ? new Date(r.startDate).getTime() : null),
      cell: (r) => (
        <span className="chrome-mono text-[11px] text-[var(--muted-foreground)]">
          {r.startDate ?? "—"}
        </span>
      ),
    },
    {
      key: "end",
      header: "End",
      sort: (r) => (r.endDate ? new Date(r.endDate).getTime() : null),
      cell: (r) => (
        <span className="chrome-mono text-[11px] text-[var(--muted-foreground)]">
          {r.endDate ?? "—"}
        </span>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      cell: (r) => (
        <span className="text-[var(--muted-foreground)] text-xs italic max-w-[260px] truncate inline-block align-bottom">
          {r.notes ?? ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <div className="inline-flex gap-1">
          <button
            type="button"
            onClick={() => setEditingId(r.id)}
            className="inline-flex items-center px-2.5 py-1 chrome-mono text-[11px] text-[var(--raid-blue-deep)] hover:bg-[var(--raid-blue)]/10 rounded transition"
          >
            Edit
          </button>
          <form
            action={async (fd) => {
              if (!confirm("Delete this posting? This cannot be undone."))
                return;
              await deletePosting(fd);
            }}
            className="inline"
          >
            <input type="hidden" name="id" value={r.id} />
            <button
              type="submit"
              className="inline-flex items-center px-2.5 py-1 chrome-mono text-[11px] text-[#B33] hover:bg-red-50 rounded transition"
            >
              Delete
            </button>
          </form>
        </div>
      ),
    },
  ];

  // If a row is being edited, render the table normally but inject the
  // edit form via a wrapping <details>-style render. Simpler: render the
  // SortableTable, then below it (or replacing the row's notes column),
  // show the edit panel for the active row.
  // For minimum UX disruption, show an EditPanel above the table.
  const editingRow = editingId
    ? rows.find((r) => r.id === editingId)
    : undefined;

  return (
    <div className="space-y-3">
      {editingRow && (
        <EditPostingPanel
          row={editingRow}
          onClose={() => setEditingId(null)}
        />
      )}

      <div className="overflow-hidden rounded-md border border-black/[0.06]">
        <SortableTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          initialSort={{ key: "status", dir: "asc" }}
        />
      </div>
    </div>
  );
}

function EditPostingPanel({
  row,
  onClose,
}: {
  row: PostingRow;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<PostingRow["status"]>(row.status);
  const showEndDate = status !== "Current";

  return (
    <div className="surface-card p-4 border border-[var(--raid-blue)]/30">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="overline">Edit posting</span>
        <span className="text-sm">
          {row.individualName} → {row.roleTitle}
          <span className="text-[var(--muted-foreground)]">
            {" "}
            · {row.unitName}
          </span>
        </span>
      </div>

      <form
        action={async (fd) => {
          const result = await updatePosting(fd);
          if (!result.ok) {
            alert(result.error);
            return;
          }
          onClose();
        }}
        className="grid md:grid-cols-2 gap-3"
      >
        <input type="hidden" name="id" value={row.id} />

        <div className="space-y-1.5">
          <label className="overline">Status</label>
          <select
            name="status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as PostingRow["status"])
            }
            className={inputClass}
          >
            <option value="Candidate">Candidate</option>
            <option value="Planned">Planned</option>
            <option value="Current">Current</option>
            <option value="Past">Past</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="overline">
            {status === "Past" ? "Start date" : "Posted-in date"}
          </label>
          <input
            name="startDate"
            type="date"
            defaultValue={row.startDate ?? ""}
            required={status !== "Candidate"}
            className={inputClass}
          />
        </div>

        {showEndDate ? (
          <div className="space-y-1.5">
            <label className="overline">
              End date{" "}
              <span className="text-[var(--muted-foreground)] normal-case tracking-normal">
                {status === "Past" ? "(required)" : "(optional)"}
              </span>
            </label>
            <input
              name="endDate"
              type="date"
              defaultValue={row.endDate ?? ""}
              required={status === "Past"}
              className={inputClass}
            />
          </div>
        ) : (
          <p className="chrome-mono text-[10px] text-[var(--muted-foreground)] leading-snug self-end pb-2">
            Currently on the job — no end date. Switching to Past requires an
            end date.
          </p>
        )}

        <div className="space-y-1.5 md:col-span-2">
          <label className="overline">Notes</label>
          <input
            name="notes"
            defaultValue={row.notes ?? ""}
            placeholder="Optional context"
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 rounded-md bg-[var(--raid-blue)] hover:bg-[var(--raid-blue-deep)] text-white text-sm font-medium transition active:scale-[0.98]"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 chrome-mono text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full border border-black/15 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--raid-blue)] focus:ring-2 focus:ring-[var(--raid-blue)]/20 transition";
