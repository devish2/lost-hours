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
GetTodayDashboard (aggregator + Lost Time + per-app breakdown)
        ↓
Today UI
```

## Per-app breakdown (D3.9)

After effective classification (D3.6), **the same clipped session list** feeds daily totals, Lost Time, and **`aggregateTodayUsageByApp`**.

| Rule | Detail |
|------|--------|
| Row identity | `app.packageName` (not display name, platform, or classification) |
| Display label | Most recent non-empty `app.displayName` in Today window; UI falls back to `packageName` |
| Platform | Metadata from the most recent effective session; does not split rows |
| `trackedDurationMs` | Sum of valid session durations for the package |
| `lostDurationMs` | Sum of **WASTE** session durations only (not derived from row classification) |
| Sort | `trackedDurationMs` descending, then `packageName` ascending |
| UNKNOWN apps | Shown even when Lost Time is 0 (e.g. Chrome) |
| Mixed classification | When sessions for one package disagree, durations stay accurate; row omits single `classification` / `classificationSource` and sets mixed flags (no `MIXED` enum) |
| Reconciliation | `SUM(apps.trackedDurationMs) === totalTrackedMs`, `SUM(apps.lostDurationMs) === totalLostMs` |

Package-level only: no URL/tab/history inference (browser stays one row per package).

## App classification editing (D3.10)

Today app rows expose a classification control (read-only analytics in D3.9).

| Rule | Detail |
|------|--------|
| Identity | Mutations use **`packageName`** only (never `displayName`) |
| Boundary | `TodayLiveDashboardService` implements `TodayAppClassificationActions` and delegates to **`AppUserClassification`** |
| Persist | PRODUCTIVE / NEUTRAL / LEISURE / WASTE only; **UNKNOWN is never stored** as USER_RULE |
| Clear | Deletes deterministic `user-app:<packageName>` via `clearClassification` |
| Refresh | **Save then `RefreshTodayDashboard`** — no optimistic bucket/Lost Time patching |
| Explicit rule UI | Chooser loads **`getExplicitAppClassification`** when opened (repository truth, not effective `classificationSource` alone) |
| Mixed rows | Setting a package USER_RULE does not force the row off **Mixed** if higher-precedence rules still disagree |
| Sessions | `usage_sessions` rows are **not** rewritten on edit |
| Browser | Classifying Chrome is package-level app usage only |

## Local day semantics

**Today** uses the **device-local calendar day** (`getElapsedLocalDayWindow` / `Date` in local timezone), not UTC midnight.

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
