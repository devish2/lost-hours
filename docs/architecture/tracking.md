# Usage tracking architecture

Tracking records **facts** about app usage. It does **not** classify activity, calculate Lost Time, or persist `UsageSession` rows.

Code: `apps/mobile/src/infrastructure/tracking`.

## Contract: `UsageTrackingProvider`

| Method | Purpose |
|--------|---------|
| `getPermissionStatus()` | Normalized access state |
| `openPermissionSettings()` | Open system Usage Access settings |
| `getUsageEvents(fromTimestamp, toTimestamp)` | Domain `UsageEvent[]` for **`[from, to)`** |

Requires `fromTimestamp < toTimestamp` or the provider throws.

## Permission abstraction

`UsageTrackingPermissionStatus`:

- **GRANTED**
- **DENIED**
- **UNKNOWN**

Unrecognized native strings map to **UNKNOWN**.

## Implementations

| Provider | Status |
|----------|--------|
| `MockUsageTrackingProvider` | Tests / explicit dev injection only |
| `AndroidUsageTrackingProvider` | Production Android when native module is registered |

## Composition (D2.4)

`createUsageTrackingComposition()` in `AppProviders` via `UsageTrackingProvider` context:

- Does **not** silently substitute mock data when the native module is missing.
- iOS and other platforms → `UNSUPPORTED_PLATFORM` (no Screen Time integration).

## Native boundary

### Current (after D2.4)

```
UsagePermissionScreen
        ↓
UsageTrackingProvider (context)
        ↓
AndroidUsageTrackingProvider
        ↓
LostHoursUsageTracking (RN)
        ↓
UsageAccessController + UsageStatsEventCollector
```

- Permission UI reads real provider state; **Open Settings** uses native navigator.
- Re-check on navigation focus and when app becomes **active** after Settings.
- **Main** navigation guarded — requires **GRANTED** (re-checked on Continue).
- **D2.8:** Today triggers foreground sync via `SyncUsageSessions` on focus/refresh; see [today-dashboard.md](./today-dashboard.md).

### Session building (after D2.5)

```
getUsageEvents → UsageEvent[] → DefaultUsageSessionBuilder → UsageSession[]
```

See [session-builder.md](./session-builder.md) and [persistence.md](./persistence.md).

**D2.6:** `SyncUsageSessions` persists via SQLite (foreground/on-demand only — no background scheduler).

**D2.7:** `GetUsageSessionsForRange` + overlap reads + analytics clipping.

**D2.8:** Live Today dashboard (sync → SQLite → query → clip → analytics). No production demo data.

**D2.9:** Onboarding completion persisted via AsyncStorage; Usage Access rechecked on every cold start. See [onboarding-bootstrap.md](./onboarding-bootstrap.md).

More detail: [apps/mobile/src/infrastructure/tracking/README.md](../../apps/mobile/src/infrastructure/tracking/README.md)
