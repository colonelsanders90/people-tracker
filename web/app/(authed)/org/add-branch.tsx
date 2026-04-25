"use client";

import { useState } from "react";
import { createBranch } from "@/app/actions";

export function AddBranchButton({ parentUnitId }: { parentUnitId: number }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 chrome-mono text-[12px] text-[var(--raid-blue-deep)] bg-white border border-dashed border-[var(--raid-blue)] hover:bg-[var(--raid-blue)]/10 px-4 py-2 rounded-md transition"
      >
        + Add branch
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        try {
          await createBranch(fd);
          setOpen(false);
        } catch (e) {
          alert((e as Error).message);
        }
      }}
      className="surface-card p-4 space-y-3 max-w-md"
    >
      <input type="hidden" name="parentUnitId" value={parentUnitId} />
      <div className="overline">Add a branch</div>
      <div className="space-y-1.5">
        <label htmlFor="branch-name" className="chrome-mono text-[10px] text-[var(--muted-foreground)] block">
          Branch name (e.g. SWiFT, CyDef)
        </label>
        <input
          id="branch-name"
          name="name"
          required
          autoFocus
          className="w-full border border-black/15 rounded px-2 py-1.5 text-sm bg-white"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="head-title" className="chrome-mono text-[10px] text-[var(--muted-foreground)] block">
          Branch head title (optional, e.g. &quot;Hd SWiFT&quot;) — leave blank to add the head later
        </label>
        <input
          id="head-title"
          name="headTitle"
          placeholder="Hd …"
          className="w-full border border-black/15 rounded px-2 py-1.5 text-sm bg-white"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-1.5 chrome-mono text-[12px] bg-[var(--raid-blue)] text-white rounded hover:bg-[var(--raid-blue-deep)]"
        >
          Create branch
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="chrome-mono text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
