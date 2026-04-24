# Individuals — list schema

People tracked by the tool.

## Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `Title` | Single line of text | Yes | Full name. SP default `Title` field. |
| `EmployeeId` | Single line of text | No | HR identifier. Unique if provided. |
| `Rank` | Single line of text | No | Rank/grade. Will become a lookup once `rank-schema.md` is defined. |
| `Specialisation` | Single line of text | No | Free text (e.g., "Cyber", "Data"). |
| `Email` | Single line of text | No | Contact. |
| `IsActive` | Yes/No | Yes | `No` for departed staff. Keeps history readable without deleting. |

## What is NOT stored here

- **Current role** — derived from `Postings` where `IndividualId = this` and `Status = Current`. Storing it here would duplicate and drift.
- **Posting dates** — same, lives in `Postings`.

## Indexing

- Index `IsActive`.
- Index `EmployeeId` (if used).

## Example rows

| Title | EmployeeId | Rank | Specialisation |
|-------|-----------|------|----------------|
| Jane Tan | 12345 | _(TBD)_ | Software Engineering |
| Alex Lim | 67890 | _(TBD)_ | Data Analytics |
