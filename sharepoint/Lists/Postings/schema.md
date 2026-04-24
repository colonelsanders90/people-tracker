# Postings — list schema

The movement ledger. One row per (individual, role, time window, status). This is the heart of the tracker — both views read from this list.

## Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `Title` | Single line of text | Yes | Auto-composed display, e.g., "Jane Tan → Engineer (Branch A)". SP requires `Title`. |
| `IndividualId` | Lookup → Individuals | Yes | Who. |
| `RoleId` | Lookup → Roles | Yes | Where. |
| `Status` | Choice | Yes | `Past`, `Current`, `Planned`, `Candidate`. |
| `StartDate` | Date | Conditional | Required for `Past`, `Current`, `Planned`. Optional for `Candidate`. |
| `EndDate` | Date | Conditional | Required for `Past`. Optional (estimated) for `Current` and `Planned`. Optional for `Candidate`. |
| `Notes` | Multiple lines of text | No | HR remarks — reason, decision context, caveats. |
| `CreatedByHR` | Person or Group | Yes | Who entered this row. SP's built-in `Created By` is fine; this field is explicit for audit clarity. |

## Statuses — what they mean

- **Past** — completed movement. Both `StartDate` and `EndDate` set, both in the past.
- **Current** — active posting. `StartDate` set (in the past), `EndDate` is the estimated end (future).
- **Planned** — HR has committed. `StartDate` is future. `EndDate` may be an estimate.
- **Candidate** — HR is considering this pairing. Dates optional — may not be decided yet.

## Invariants (enforced by HR process, not SP list validation)

- An individual has **at most one** row with `Status = Current`.
- A role has **at most one** row with `Status = Current`.
- An individual can have **multiple** `Candidate` rows (weighing options).
- A role can have **multiple** `Candidate` rows (multiple candidates being considered).
- When a `Current` posting ends, HR either:
  - Changes its `Status` to `Past` and sets actual `EndDate`, then promotes a `Planned` row to `Current`; or
  - Lets automation do it (if ever built — not in v1).

## Indexing

- Index `IndividualId`.
- Index `RoleId`.
- Index `Status`.
- Index `StartDate`.

Both views hit this list heavily — these indexes matter for SP2013 performance, especially with list-threshold rules.

## View queries (conceptual)

**Individual view:**
```
WHERE IndividualId = :id
ORDER BY StartDate
```

**Role view:**
```
WHERE RoleId = :id
ORDER BY StartDate
```

**"Who is moving where next"** (across all individuals):
```
WHERE Status IN ('Planned', 'Candidate')
  AND StartDate <= :twoYearsOut
ORDER BY StartDate
```

**"Who is coming in next"** (for vacant roles):
```
WHERE RoleId IN (SELECT Id FROM Roles WHERE IsVacant = Yes)
  AND Status IN ('Planned', 'Candidate')
ORDER BY StartDate
```

## Example rows

| IndividualId | RoleId | Status | StartDate | EndDate |
|--------------|--------|--------|-----------|---------|
| Jane Tan | Engineer (Branch A) | Past | 2023-01-01 | 2024-12-31 |
| Jane Tan | Senior Engineer (Branch A) | Current | 2025-01-01 | 2026-12-31 |
| Jane Tan | Head Branch A | Planned | 2027-01-01 | _(blank)_ |
| Alex Lim | Head Branch A | Candidate | _(blank)_ | _(blank)_ |
