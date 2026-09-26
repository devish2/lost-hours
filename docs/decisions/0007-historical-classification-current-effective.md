# ADR 0007: Historical analytics use current-effective classification

## Status

Accepted (Day 4 / D4.1)

## Context

Historical analytics and Time Receipt need a explicit rule for reclassification:

- **Option A — Current-effective:** All historical sessions are interpreted with **today’s** enabled rules (Day 3 Today behavior).
- **Option B — As-classified-at-time:** Historical Lost/productive totals reflect rules that existed when the session occurred.
- **Option C — Temporal rule history:** Store versioned rules and resolve by session timestamp.

Day 3 already separates tracking facts from classification policy:

- `usage_sessions` rows are not rewritten when the user changes app rules.
- Effective classification is applied in application layer via `applyEffectiveClassificationToUsageSessions` after read/clip.

Example: Snapchat was WASTE in week 1; user changes rule to NEUTRAL in week 2.

## Decision

**MVP historical analytics (History, Time Receipt, weekly rollups) use Option A — current-effective classification**, matching Day 3 Today.

Pipeline for any date window:

1. `UsageSessionRepository.findOverlapping(window)`
2. `clipUsageSessionsToWindow`
3. `applyEffectiveClassificationToUsageSessions` with **current** enabled rules
4. Aggregate (daily / weekly / receipt)

We **do not** persist effective classification back to `usage_sessions`.

We **do not** introduce temporal/versioned rule history in MVP Day 4.

## Rationale

- Aligns with user expectation that correcting a rule **updates interpretation everywhere** without mutating tracking facts.
- Reuses proven Day 3 pipeline; no schema migration for basic History.
- Keeps SQLite session repository free of classification policy (ADR 0003).

## Consequences

**Positive**

- Reclassification is non-destructive and immediately reflected in historical views.
- Single classifier path; testable with rule fixtures.

**Negative / deferred**

- A **issued** Time Receipt snapshot from the past would **not** stay immutable if the user later changes rules (same as re-opening Today after a rule change).
- If product later requires immutable issued receipts, add **report snapshots** or **rule versioning** (Option C) as a separate ADR — not MVP.

## Alternatives considered

| Option | Rejected for MVP because |
|--------|---------------------------|
| B — As-at-time | Requires rule history or denormalized classification at sync time; conflicts with non-destructive reclassification. |
| C — Versioned rules | Higher schema and UX complexity; defer until immutable receipts are a committed requirement. |

## References

- ADR 0003 — Separate tracking from classification
- `RefreshTodayDashboard` — sync → overlap query → clip → effective classify → aggregate
- `applyEffectiveClassificationToUsageSessions`
