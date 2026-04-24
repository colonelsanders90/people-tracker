# Units — list schema

Organizational units. Self-referencing tree. L1 = parent unit (e.g., RAiD), L2 = branches. L3 is not modelled here — L3 lives on the Roles side, attached to an L2 branch.

## Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `Title` | Single line of text | Yes | Unit name (e.g., "RAiD", "Branch A"). SP default `Title` field. |
| `Code` | Single line of text | No | Short code for display (e.g., "RAID", "BRA"). |
| `Level` | Choice | Yes | `L1` or `L2` only. |
| `ParentUnitId` | Lookup → Units | No | L1 rows leave this blank. L2 rows point to their L1. |
| `Description` | Multiple lines of text | No | Free text. |
| `IsActive` | Yes/No | Yes | Default `Yes`. For soft-deleting deprecated units. |

## Indexing

- Index `ParentUnitId` (org-chart queries hit this constantly).
- Index `Level`.

## Validation (manual, via HR process — SP2013 list validation is limited)

- An L1 row must have `ParentUnitId` empty.
- An L2 row must have `ParentUnitId` set to an L1 row.

## Example rows

| Title | Code | Level | ParentUnitId |
|-------|------|-------|--------------|
| RAiD | RAID | L1 | _(blank)_ |
| Branch A | BRA | L2 | RAiD |
| Branch B | BRB | L2 | RAiD |
