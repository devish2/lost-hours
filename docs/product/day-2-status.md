# Lost Hours — Day 2 status

Branch baseline (committed): `6eb6aac` — *feat: establish Lost Hours mobile foundation*

All Day 2 implementation (D2.1–D2.10) remains **uncommitted** until physical validation and an explicit commit.

## Checkpoints

| ID | Scope | Status (code) |
|----|--------|----------------|
| D2.1 | Android Usage Access (AppOps, settings) | Implemented |
| D2.2 | UsageStatsManager event collection | Implemented |
| D2.3 | React Native bridge `LostHoursUsageTracking` | Implemented |
| D2.4 | Tracking composition + permission UI | Implemented |
| D2.5 | Deterministic Session Builder | Implemented |
| D2.6 | SQLite persistence + opening-identity reconciliation | Implemented |
| D2.7 | Overlap queries + analytics clipping | Implemented |
| D2.8 | Live Today dashboard (foreground sync) | Implemented |
| D2.9 | Onboarding completion persistence + bootstrap | Implemented |
| D2.10 | Integration audit & hardening | Implemented (automated) |

## Architecture — usage pipeline

```
Android UsageStatsManager
        ↓
Native Kotlin collector
        ↓
RN bridge (LostHoursUsageTracking)
        ↓
UsageTrackingProvider
        ↓
UsageEvent[]
        ↓
Session Builder
        ↓
UsageSession[]
        ↓
SQLite (opening-identity reconciliation)
        ↓
findOverlapping
        ↓
clipUsageSessionsToWindow (analytics-only)
        ↓
Daily aggregation
        ↓
Lost Time (WASTE only)
        ↓
Today UI
```

## Architecture — app launch

```
App start
   ↓
AppBootstrapGate
   ↓
OnboardingStateRepository (AsyncStorage)
   ↓
if incomplete → Welcome
if complete → native getPermissionStatus()
   ↓
GRANTED → Main
DENIED/UNKNOWN → Usage Permission
```

**Permission grant is not persisted as truth.** Only `onboardingCompleted` is stored.

## Analytics note (overlap)

`totalTrackedMs` sums clipped session durations. Overlapping per-package sessions from Android are **not** deduplicated into wall-clock time in Day 2. Summed tracked time can exceed unique attention time when intervals overlap. Overlap deduplication is a future product decision.

## Physical Android validation

**PENDING** — not performed as part of D2.10. See [day-2-physical-validation.md](./day-2-physical-validation.md).

Day 2 is **not** product-complete until that checklist passes.

## Non-goals retained

No background sync, WorkManager, AccessibilityService, classification defaults, content inference, cloud sync, or History live data in Day 2.
