# ADR 0005: UsageTrackingProvider boundary

## Status

Accepted

## Context

React Native business logic must not call Android `UsageStatsManager` directly. Tests and demo mode need deterministic usage facts without a device.

## Decision

Introduce **`UsageTrackingProvider`** as the sole infrastructure entry for usage facts:

- Permission status abstraction
- `UsageEvent[]` for a half-open timestamp range **`[from, to)`**

Implementations:

- **`MockUsageTrackingProvider`** — tests and development
- **`AndroidUsageTrackingProvider`** — maps a native module contract (Kotlin implementation deferred)

Providers do **not** classify, calculate Lost Time, or write SQLite.

## Consequences

**Positive**

- Mock-driven development of downstream session and analytics logic.
- Native isolation and future platform swap (e.g. iOS) without rewriting domain.
- Clear place for permission UX to attach later.

**Negative**

- Extra interface and mapping code.
- End-to-end tracking remains incomplete until Kotlin and Session Builder land.
