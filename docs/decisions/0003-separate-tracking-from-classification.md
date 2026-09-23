# ADR 0003: Separate tracking from classification

## Status

Accepted

## Context

Mixing “what happened” with “was it good or bad” leads to brittle analytics, untestable UI, and policy encoded in OS adapters.

## Decision

**Tracking records facts.** **Classification makes value judgments.**

Examples:

- Tracking: Instagram foreground at timestamp *T* → `UsageEvent`.
- Classification: that activity → `WASTE` (via rules), stored on `UsageSession`.

Tracking providers and SQLite mappers must not embed classification policy.

## Consequences

**Positive**

- Testable pipelines with mock events and rule sets.
- User rules and overrides can change without rewriting native code.
- Clear boundaries for future Session Builder and classifier placement.

**Negative**

- Requires an explicit session-building and classification step in the live pipeline (not yet wired).
- More types and layers than a monolithic “screen time score” app.
