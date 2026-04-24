# Rank / grade schema

**TODO** — to be defined later. Tracked as lower priority per initial scoping.

## Why it's deferred

The tracker records movements; it does not enforce rank-based progression rules. So a rank schema is useful for **display and filtering** but is not blocking for v1.

## When we define it, capture

- The full ordered list of ranks/grades in use (military, civilian, or mixed).
- Whether two separate ladders exist (e.g., uniformed vs. DXO civilian) and how they compare.
- Abbreviations vs. full names.
- Any rank that implies an automatic role level (e.g., "LTCs typically hold L2 head roles").

## Where it plugs in

Once defined:
- `Individuals.Rank` becomes a lookup to a `Ranks` list (add a fifth list), or stays as a choice field with a fixed option set.
- Role view can filter candidates by rank band.
- Individual view can colour-code historical postings by rank-at-time.
