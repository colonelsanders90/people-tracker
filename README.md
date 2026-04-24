# RAiD Manpower Tracker

HR tool for tracking manpower movements across the RAiD department on SharePoint 2013.

## Purpose

Track who is moving in and out of which roles, in two views:

1. **Individual view** — for a given person, show their posting history, current role, and any planned/candidate future postings (1–2 year horizon).
2. **Role view** — for a given role, show past incumbents, current holder, and any planned/candidate individuals being considered for it (1–2 year horizon).

Both views read from the same `Postings` ledger — different filters, shared org-chart component.

## Two dimensions

- **By individual** — people, their ranks, their movement timelines.
- **By job role** — roles arranged in a structural hierarchy:
  - **L1**: parent unit (e.g., RAiD) + its Head
  - **L2**: branches (sub-units) + their Heads
  - **L3**: everyone else (staff)

Cross-branch and cross-L1 movements are supported — the tool tracks actual movements, it does not enforce a progression path.

## Repo layout

```
manpower-tracker/
├── docs/          SHARED — data model, hierarchy, movement tracking rules
├── web/           Next.js prototype for Railway (iterate here first)
└── sharepoint/    SP2013 port (scaffolded; implementation pending)
```

`docs/` is the source of truth. Both builds read from it.

## Build strategy

**Phase 1** — Prototype on Railway using Next.js + Postgres (`web/`). Validate the HR workflow, UX, and data model with a fast stack.

**Phase 2** — Port to SharePoint 2013 (`sharepoint/`) once the design is stable. Same lists, same views, different runtime.

## Next steps

- `cd web/` and follow `web/README.md` to run locally.
- Drop the deployment-approach md into `docs/deployment.md` when ready (for the SP2013 phase).
- Define the rank/grade ladder in `docs/rank-schema.md` when ready.
