# ADR 0004: Lost Time equals WASTE duration (MVP)

## Status

Accepted

## Context

Users need a single headline metric for unwanted digital time without conflating recreation, unknown activity, or neutral necessities.

## Decision

For MVP, **Lost Time** is:

```
sum(session.durationMs) where classification === WASTE
```

(valid sessions only; see `isValidAnalyticsSession`).

**LEISURE** does not count toward Lost Time. **UNKNOWN** does not count. **PRODUCTIVE** and **NEUTRAL** do not count.

## Consequences

**Positive**

- Simple, explainable definition aligned with “Lost Hours” naming.
- Implemented in `DefaultLostTimeCalculator` and tested independently of UI.

**Negative**

- Users who treat some LEISURE as “lost” cannot express that without reclassification or a future product metric.
- Product may later add separate scores; that requires an explicit ADR change, not silent UI tweaks.
