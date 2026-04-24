# Roles — list schema

Job positions. Each role belongs to exactly one unit. L3 roles live under L2 branches.

## Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `Title` | Single line of text | Yes | Role title (e.g., "Head RAiD", "Head Branch A", "Engineer"). |
| `UnitId` | Lookup → Units | Yes | The unit this role sits in. |
| `Level` | Choice | Yes | `L1`, `L2`, or `L3`. Must match (L1/L2) or live under (L3) the unit's level. |
| `IsHead` | Yes/No | Yes | `Yes` only for the single head role of a unit (L1 head, L2 head). L3 roles are always `No`. |
| `StandardTenureMonths` | Number | No | Typical tenure in months. Defaults: L3=24, L2=30, L1=36. Informational only. |
| `IsVacant` | Yes/No | Yes | Manual flag set by HR when a vacancy is upcoming or open. |
| `Specialisation` | Single line of text | No | Free text (e.g., "Software Engineering"). Convert to lookup later if needed. |
| `IsActive` | Yes/No | Yes | For soft-deleting retired roles. |

## Indexing

- Index `UnitId`.
- Index `Level`.
- Index `IsVacant` (role view filters on this often).

## Validation (via HR process)

- Each Unit has **at most one** role with `IsHead = Yes` and matching `Level`.
- L3 roles' `UnitId` must point to an L2 unit.
- L2 role with `IsHead = Yes` must have `UnitId` pointing to an L2 unit.
- L1 role with `IsHead = Yes` must have `UnitId` pointing to an L1 unit.

## Example rows

| Title | UnitId | Level | IsHead |
|-------|--------|-------|--------|
| Head RAiD | RAiD | L1 | Yes |
| Head Branch A | Branch A | L2 | Yes |
| Engineer | Branch A | L3 | No |
| Analyst | Branch A | L3 | No |
