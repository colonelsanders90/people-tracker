# Database setup — Postgres on Railway

The web app talks to Postgres through Drizzle ORM. There are **three** environments to think about:

| Env | What it is | `DATABASE_URL` source |
|---|---|---|
| Local dev (`npm run dev`) | Your machine | `web/.env.local` |
| Schema push / seed (run from your laptop, hits Railway) | Your machine talking to Railway over the public internet | `web/.env.local` (temporarily) |
| Production (`next start` on Railway) | The Railway web service | Reference variable from the Postgres service (private network) |

You only ever set this in two places: a `.env.local` file on your laptop, and a referenced variable in the Railway dashboard.

---

## One-time Railway setup

### 1. Add a Postgres service

In your Railway project → **+ New** → **Database** → **Add PostgreSQL**.

Railway provisions it and exposes two URLs on the Postgres service's **Variables** tab:

- `DATABASE_URL` — internal hostname, only reachable from inside the Railway private network. **This is what production uses.**
- `DATABASE_PUBLIC_URL` — public hostname with TCP proxy. Reachable from your laptop. **This is what you use for one-off `db:push` / `db:seed`.**

Don't paste either URL into a file by hand — use the steps below.

### 2. Wire the web service to Postgres

In your **web service** (the Next.js app, not Postgres) → **Variables** → **+ New Variable** → **Add Reference**:

- Variable name: `DATABASE_URL`
- Reference: `Postgres.DATABASE_URL` (the **internal** one)

Save. Railway redeploys the web service automatically. From now on the running app reads `process.env.DATABASE_URL` at startup and connects over the private network — fast and free.

> **Why reference instead of copy?** If you copy the value, it goes stale when Railway rotates credentials. Reference variables auto-update.

### 3. Push the schema (first time + whenever `lib/db/schema.ts` changes)

This step creates / alters tables to match the Drizzle schema. Run it from your laptop pointing at the Railway Postgres.

1. In Railway → Postgres service → **Variables** → click the eye icon on `DATABASE_PUBLIC_URL` → copy the value.
2. Create `web/.env.local` (this file does not exist by default — it's gitignored, so it never gets committed) and paste the URL as `DATABASE_URL`:

   ```bash
   # web/.env.local — gitignored, do not commit
   DATABASE_URL=postgresql://postgres:XXXX@viaduct.proxy.rlwy.net:NNNNN/railway
   ```

3. From the `web/` directory:

   ```bash
   npm run db:push
   ```

   You should see Drizzle apply the schema and exit. If you get `ECONNREFUSED`, you copied the internal URL by mistake — go back and grab `DATABASE_PUBLIC_URL`.

   > **If `db:push` asks for an interactive prompt** ("schema conflict"), it's because there's leftover state in the DB (an old table from a previous attempt). Wipe the public schema once and retry:
   > ```bash
   > psql "$DATABASE_URL" -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
   > ```

### 4. Seed sample data (first time only, or whenever you want to reset)

Same `.env.local` from step 3 still works. Then:

```bash
npm run db:seed
```

The seed script wipes all four tables and repopulates: 1 RAiD HQ unit, 3 branches, 8 individuals (Col Tan / LTC Siti / LTC Raj / MAJ Jane / MAJ Alex / CPT Daniel / CPT Priya / CPT Marcus), and a realistic spread of postings — past, current, planned, candidate. Look at `web/scripts/seed.ts` to tweak.

> **Warning:** `db:seed` calls `DELETE FROM postings, roles, individuals, units` first. Don't run it against a database that has real data you care about.

### 5. Verify

Open your live Railway URL (`*.up.railway.app`) — you should see real data on `/`, `/org`, `/individuals`, `/roles`. The `/admin` page can now actually add / delete postings and toggle vacancies.

---

## After the first time

| When | What to do |
|---|---|
| You change `lib/db/schema.ts` (added a column, etc.) | `npm run db:push` from `web/` with the public URL in `.env.local` |
| You want to reset to the seed | `npm run db:seed` from `web/` with the public URL in `.env.local` |
| You're just developing locally with a local Postgres | Set `DATABASE_URL=postgres://localhost:5432/manpower_tracker` in `.env.local`, run a local Postgres, then `db:push` + `db:seed` |
| Production needs to redeploy | Just push to GitHub. Railway auto-redeploys, and Drizzle has nothing to do at runtime — the schema is already there. |

---

## Local Postgres (optional, for offline dev)

If you want to develop without hitting Railway:

```bash
# install + start postgres locally (macOS)
brew install postgresql@16
brew services start postgresql@16
createdb manpower_tracker

# point .env.local at it
echo 'DATABASE_URL=postgres://localhost:5432/manpower_tracker' > web/.env.local

# push schema + seed
cd web
npm run db:push
npm run db:seed

# develop
npm run dev
```

The connection layer (`web/lib/db/index.ts`) auto-disables SSL when the URL contains `localhost`, so you don't need `?sslmode=disable`.

---

## Troubleshooting

- **`relation "roles" does not exist`** — schema hasn't been pushed yet. Run `db:push` per step 3.
- **`password authentication failed`** — your `.env.local` has a stale credential. Re-copy `DATABASE_PUBLIC_URL` from Railway.
- **`ECONNREFUSED 127.0.0.1:5432` from `db:seed`** — the env file isn't being loaded. `db:seed` uses `tsx --env-file-if-exists=.env.local`, which needs Node ≥ 20.10 / tsx ≥ 4. If you're on an older Node, upgrade (`brew upgrade node`) or `export DATABASE_URL=…` in your shell before running.
- **`ECONNREFUSED <host>` from your laptop** — you used the internal `DATABASE_URL` instead of `DATABASE_PUBLIC_URL`. Switch.
- **drizzle-kit prompts interactively / errors about TTY** — leftover tables in the DB confuse its diff. Drop and recreate the public schema with the `psql` one-liner above, then retry.
- **`SELF_SIGNED_CERT_IN_CHAIN` from production** — already handled by `lib/db/index.ts` (`ssl: { rejectUnauthorized: false }` when not localhost). If you see this anyway, double-check `DATABASE_URL` in production isn't pointing at localhost.
- **Drizzle Studio** — `npm run db:studio` opens a local browser GUI for inspecting / editing rows. Same `.env.local` rules apply.

---

## What's where

```
web/
├── .env.example         Template — copy to .env.local
├── drizzle.config.ts    drizzle-kit config (reads DATABASE_URL via dotenv)
├── lib/db/
│   ├── schema.ts        Source of truth: 4 tables (units, roles, individuals, postings)
│   └── index.ts         pg Pool + drizzle client. SSL auto-toggled by URL.
├── lib/queries.ts       Read-side data fetchers used by every page
├── app/actions.ts       Server Actions (createPosting, deletePosting, toggleRoleVacancy)
└── scripts/seed.ts      Reset + repopulate sample data
```
