# Manpower Tracker — Web prototype

Next.js 16 + Drizzle + Postgres prototype of the RAiD manpower movement tracker. Deployed target: **Railway**. This is the Phase 1 build — see `../README.md` and `../docs/` for the design shared with the SP2013 port.

## Stack

- Next.js 16 (App Router, React 19, Turbopack)
- TypeScript
- Drizzle ORM + Postgres (via `pg`)
- Tailwind v4 + shadcn/ui
- No auth — HR officer is assumed; add a mock user picker later if needed

## Run locally

1. **Postgres.** Either start a local Postgres or use a cloud one. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.

   ```bash
   cp .env.example .env.local
   # edit .env.local with your Postgres URL
   ```

2. **Push schema and seed.**

   ```bash
   npm run db:push     # creates tables from lib/db/schema.ts
   npm run db:seed     # populates RAiD + 3 branches + 8 people + sample postings
   ```

3. **Dev server.**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Drizzle schema to DB (dev-only; use migrations for prod) |
| `npm run db:studio` | Open Drizzle Studio to inspect data |
| `npm run db:seed` | Reset and seed sample data |

## Project layout

```
web/
├── app/
│   ├── page.tsx                  Landing / view switcher
│   ├── individuals/
│   │   ├── page.tsx              List of people
│   │   └── [id]/page.tsx         Individual view: timeline + "where next"
│   ├── roles/
│   │   ├── page.tsx              List of roles
│   │   └── [id]/page.tsx         Role view: incumbents + "who next"
│   ├── admin/page.tsx            HR officer: add/delete postings, toggle vacancy
│   └── actions.ts                Server Actions for mutations
├── components/
│   ├── nav.tsx
│   ├── org-chart.tsx             Recursive unit/role tree with highlight
│   ├── posting-timeline.tsx      Gantt-style bars per posting status
│   ├── status-badge.tsx
│   └── ui/…                      shadcn primitives
├── lib/
│   ├── db/
│   │   ├── schema.ts             Drizzle schema (4 tables mirroring ../docs/data-model.md)
│   │   └── index.ts              DB client
│   ├── hierarchy.ts              buildUnitTree(units, roles) → UnitNode[]
│   └── queries.ts                Page-level data fetchers
├── scripts/seed.ts               tsx-run seed script
├── drizzle.config.ts
└── .env.example
```

## Deploy to Railway

1. **Create a new Railway project** → add a **PostgreSQL** service.
2. **Deploy this app from GitHub** (or `railway up` from this directory). Railway detects Next.js automatically.
3. In the app service **Variables**, reference the Postgres service's `DATABASE_URL`:
   - Open the app service → Variables → **Reference** → pick the Postgres service's `DATABASE_URL`.
4. **First-time setup** — after the first deploy, run the schema push and seed. Easiest via Railway's one-off commands or shell:

   ```bash
   railway run npm run db:push
   railway run npm run db:seed
   ```

   (Or run `db:push` locally against the Railway Postgres by pulling its `DATABASE_URL` into `.env.local`.)

5. **Open the generated Railway URL** and you're live.

Production health checks: `GET /` should render and show non-zero counts after seeding.

## Data model

All data flows through four tables defined in `lib/db/schema.ts`:

- `units` — L1/L2 organisational tree (self-referencing via `parent_unit_id`).
- `roles` — positions within a unit. L3 roles live under L2 units.
- `individuals` — people.
- `postings` — the movement ledger. `status` ∈ {Past, Current, Planned, Candidate}. Both views filter this table.

See `../docs/data-model.md` and `../docs/movement-tracking.md` for why this shape.

## What's deliberately missing

- **Auth.** No login. All pages are accessible to anyone with the URL. For the SP2013 port, SharePoint provides auth natively.
- **Access control.** Any user can hit `/admin`. Add middleware or a session gate when promoting beyond a prototype.
- **Migrations.** `db:push` is fine for iterating on schema during prototyping. For production, switch to `drizzle-kit generate` + `drizzle-kit migrate`.
- **Tests.** None yet. Prototype first; add once the UX is locked.
- **Rank-based styling / filters.** Pending the rank schema (`../docs/rank-schema.md`).

## Porting to SharePoint 2013

This is the Railway prototype. The intent is to validate the HR workflow here, then rebuild the same views under `../sharepoint/`. Reusable pieces for the port:

- `lib/hierarchy.ts` — pure function, framework-free. Drops directly into the SP2013 JS bundle.
- `lib/queries.ts` — rewrite against the SharePoint REST API (`/_api/web/lists/...`), same return shapes.
- Components — visual design transfers; JSX → jQuery-rendered templates (or a SP2013-compatible framework).
- `docs/` — the shared source of truth, no rewrite needed.
