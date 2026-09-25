# ADR 0003: Separate tracking from classification

## Status

Accepted

## Context

Mixing “what happened” with “was it good or bad” leads to brittle analytics, untestable UI, and policy encoded in OS adapters.

## Decision

**Tracking records facts.** **Classification makes value judgments.**

Examples:

- Tracking: Instagram foreground at timestamp *T* → `UsageEvent`.
- Classification: value judgment from enabled rules + `ActivityClassifier` at **analytics read time** (D3.6). Sync persists tracking facts; `usage_sessions.classification` / `classification_source` are **not** updated when the user changes app rules (D3.7). Those columns are sync-time session fields, not the authoritative user judgment store.

Tracking providers and SQLite mappers must not embed classification policy.

## Consequences

**Positive**

- Testable pipelines with mock events and rule sets.
- User rules and overrides can change without rewriting native code.
- Clear boundaries for future Session Builder and classifier placement.

**Negative**

- Requires an explicit effective-classification step after session read/clip and before dashboard aggregation (wired in D3.6 `RefreshTodayDashboard`).
- More types and layers than a monolithic “screen time score” app.
