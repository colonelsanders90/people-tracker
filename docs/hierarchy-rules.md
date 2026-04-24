# Hierarchy rules

The org structure has three levels. Every Unit and every Role has a `Level` that matches.

## Levels

| Level | What sits here | Example (RAiD) |
|-------|----------------|----------------|
| **L1** | Parent unit + its Head | RAiD (unit); Head RAiD (role) |
| **L2** | Sub-unit / branch + Branch Head | Branch A (unit); Head Branch A (role) |
| **L3** | All non-head staff | Engineer, Analyst, etc. (roles under Branch A, B, …) |

## Unit tree

- L1 units have no parent.
- L2 units point to an L1 parent via `ParentUnitId`.
- L3 is represented on the **Role** side, not as its own Unit tier — staff roles belong to an L2 unit (their branch).

Put differently: Units stop at L2. L3 exists only as roles within an L2 branch.

## Movement rules

Movements are **not** constrained by the hierarchy. The tracker records what actually happens.

- **Vertical** — e.g., L3 Engineer in Branch A → L2 Head of Branch A (promotion).
- **Horizontal (same L1)** — e.g., L3 Engineer in Branch A → L3 Engineer in Branch B.
- **Horizontal (across L1)** — e.g., L3 role in RAiD → L3 role in some other parent unit.
- **Any combination** of the above.

This means the movement ledger (`Postings`) does not need to validate transitions. HR officers make the call; the tool records it.

## Rank vs. level

`Level` describes the **role's position in the org chart** (L1/L2/L3). Rank/grade is a property of the **individual** and is tracked separately (see `rank-schema.md`). The two are related but not the same — a senior-ranked individual can hold an L3 role, for instance.
