# Live Today dashboard (D2.8)

Today reads **real local usage** via sync + SQLite + overlap query + analytics clipping.

## Foreground refresh pipeline

```
TodayScreen (focus / pull-to-refresh / app active)
        ↓
TodayLiveDashboardService.refreshToday()
        ↓
SyncUsageSessions [todayStart, now)
        ↓
Android UsageStats → Session Builder → SQLite
        ↓
GetUsageSessionsForRange (overlap) [todayStart, now)
        ↓
clipUsageSessionsToWindow (analytics-only)
        ↓
GetTodayDashboard (aggregator + Lost Time)
        ↓
Today UI
```

## Local day semantics

- **todayStart:** local calendar midnight for `now`
- **Sync & read window:** **[todayStart, now)** — elapsed time today (not future midnight)
- **At local midnight:** zero-length window → empty dashboard, no sync/query

## States

LOADING, SUCCESS, EMPTY, ERROR, PERMISSION_REQUIRED, TRACKING_UNAVAILABLE.

No production fallback to demo data.

## Lost Time

Real sessions from UsageStats remain **classification UNKNOWN** until rules exist → **Lost Time may be 0** while **Total Tracked > 0**. This is expected.

## Overlapping sessions

Summed **Total Tracked** may exceed unique wall-clock time when per-app sessions overlap. See [overlap-analytics.md](./overlap-analytics.md).

## Clipping

Clipped sessions use analytics ids (`|clip:`) and are **never persisted**.

## Not in D2.8

- Background/periodic sync
- Demo dashboard in production Today path
- Content/classification inference

## Device validation

Physical Android smoke test is required for D2.8 sign-off. As of the D2.8 implementation report, **no adb device was connected** (`adb devices` empty; prior wireless endpoint `192.168.1.6:40825` refused connection). Reconnect the device, run `adb reverse tcp:8081 tcp:8081`, `./gradlew installDebug`, and execute the procedure in the D2.8 spec before final approval.
