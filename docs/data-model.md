# Data model

All data lives in four SharePoint 2013 lists. Each list's field-level schema is in `Lists/<Name>/schema.md`.

## Lists

### Units
The organizational hierarchy. Rows at L1, L2, L3.
- Self-referencing via `ParentUnitId` (L2 points to its L1 parent, L3 points to its L2 parent).
- L1 rows have no parent.

### Roles
Job positions. Each role belongs to one unit.
- A role's `Level` matches its unit's `Level` (Head RAiD is L1; Head Branch A is L2; staff roles are L3).
- `IsVacant` is a manual flag set by HR when the current incumbent is leaving.

### Individuals
People. Each person has at most one **current** role at a time (via the `Postings` list, not a direct FK).

### Postings
The movement ledger — the heart of the tracker. Every row is one (individual, role, time window) pairing with a `Status`:
- `Past` — completed
- `Current` — active now
- `Planned` — HR has committed to this future movement
- `Candidate` — HR is considering this pairing, not yet decided

Both views read from this list. The "next possible postings for an individual" and "candidates for a role" are just different filters over `Status in (Planned, Candidate)`.

## Why a single Postings list

Originally considered separate `PostingHistory` + `CandidatePairings` lists. Collapsed to one because:
- Same schema — `(individual, role, start, end)` describes all four statuses.
- Both views need to stitch past/present/future together on one timeline anyway.
- Simpler to filter one list by `Status` than union two.

## Relationships

```
Units (self-ref via ParentUnitId)
  └── Roles (UnitId → Units)
        └── Postings (RoleId → Roles)
Individuals
  └── Postings (IndividualId → Individuals)
```

## Hierarchy rules

Covered in `hierarchy-rules.md`. Summary: L1 is the parent unit (RAiD), L2 are branches, L3 is everyone else. Movements can go in any direction — vertical or horizontal — across any units. The tracker records movements; it does not enforce a progression path.
