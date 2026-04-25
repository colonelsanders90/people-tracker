"use client";

import { StatusBadge } from "@/components/status-badge";
import { SortableTable, type Column } from "@/components/sortable-table";
import { deletePosting } from "@/app/actions";

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
  const columns: Column<PostingRow>[] = [
    {
      key: "status",
      header: "Status",
      sort: (r) => statusRank[r.status],
      cell: (r) => <StatusBadge status={r.status} />,
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
        <form
          action={async (fd) => {
            if (!confirm("Delete this posting? This cannot be undone.")) return;
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
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-md border border-black/[0.06]">
      <SortableTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        initialSort={{ key: "status", dir: "asc" }}
      />
    </div>
  );
}
