# Movement tracking

This document defines **how the two views work** and **what "next posting" means** in this tool.

## Core idea

There is one ledger — `Postings` — with every (individual, role, start, end, status) row. The two views are different filters / layouts over this ledger.

## Posting statuses

| Status | Meaning | Set by |
|--------|---------|--------|
| `Past` | Completed. End date is in the past. | HR, or auto-promoted from Current when end date passes |
| `Current` | Active now. Individual is currently in this role. | HR |
| `Planned` | HR has committed to this future movement. | HR |
| `Candidate` | HR is considering this pairing. Not yet decided. | HR |

An individual can have **multiple Candidate rows** (HR is weighing options). They should have only **one Current** row at a time.

A role can also have multiple Candidate rows (different people being considered).

## Individual view

**Question answered:** "Where might this person go next?"

Given an individual, show:

1. **Profile** — name, rank, current role (from the one `Current` posting).
2. **History** — timeline of their `Past` postings.
3. **Projections** — all `Planned` and `Candidate` postings for this individual in the next 1–2 years.
4. **Org-chart panel** — renders the Units/Roles tree with the person's current role highlighted. Any Candidate/Planned target roles are visually marked too.

Data query (conceptual): `Postings WHERE IndividualId = X ORDER BY StartDate`.

## Role view

**Question answered:** "Who might fill this role?"

Given a role, show:

1. **Role details** — title, unit, level, vacancy flag.
2. **Incumbent history** — timeline of `Past` + `Current` postings for this role.
3. **Candidates** — all `Planned` and `Candidate` postings for this role in the next 1–2 years.
4. **Org-chart panel** — the Units/Roles tree with this role highlighted. Candidate individuals can be shown in a side list.

Data query (conceptual): `Postings WHERE RoleId = Y ORDER BY StartDate`.

## "Next posting" is manual, not computed

HR officers create Candidate rows directly — either from the individual view ("add a possible next role for this person") or the role view ("add a possible candidate for this role"). The tool does not score or recommend. It only tracks and visualises what HR enters.

This is deliberate: posting decisions involve factors (fit, readiness, preference, command intent) that are not cleanly captured in data. The tool's job is to give HR a clear picture, not to replace judgment.

## Timeline horizon

Default view window: **1 year back, 2 years forward**. Configurable in `Scripts/app.js` when that's built.

## Vacancy

`Roles.IsVacant` is a manual flag. HR sets it when the current incumbent's posting is ending and no replacement is Planned yet. Useful for filtering the role view to "roles needing candidates soon."
