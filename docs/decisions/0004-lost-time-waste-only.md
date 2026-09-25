# ADR 0004: Lost Time equals WASTE duration (MVP)

## Status

Accepted

## Context

Users need a single headline metric for unwanted digital time without conflating recreation, unknown activity, or neutral necessities.

## Decision

For MVP (Lost Time V1, D3.8), **Lost Time** is:

```
sum(session.durationMs)
where effective classification === WASTE
and durationMs > 0
and session is already clipped to the analytics window
```

Production Today path: persisted sessions → clip → effective classification → `DefaultLostTimeCalculator`.

**Only WASTE** contributes. **PRODUCTIVE**, **NEUTRAL**, **LEISURE**, and **UNKNOWN** contribute **0** Lost Time. `classificationSource` does not change that rule.

**Overlapping WASTE sessions** are summed by session duration (no wall-clock deduplication in V1). **Platform OTHER** can contribute when classified WASTE.

Internal unit: **milliseconds** (no rounding in domain analytics). Zero Lost Time is a valid successful result.

(valid sessions only; see `isValidAnalyticsSession`).

## Consequences

**Positive**

- Simple, explainable definition aligned with “Lost Hours” naming.
- Implemented in `DefaultLostTimeCalculator` and tested independently of UI.

**Negative**

- Users who treat some LEISURE as “lost” cannot express that without reclassification or a future product metric.
- Product may later add separate scores; that requires an explicit ADR change, not silent UI tweaks.
