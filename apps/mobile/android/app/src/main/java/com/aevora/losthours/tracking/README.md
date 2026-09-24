# Android tracking (native)

## Current (D2.1 + D2.2 + D2.3)

### Usage Access (D2.1) — `usageaccess/`

| Component | Role |
|-----------|------|
| `UsageAccessPermissionChecker` | `AppOpsManager` + `OPSTR_GET_USAGE_STATS` |
| `UsageAccessSettingsNavigator` | Opens Usage Access settings |
| `UsageAccessController` | Permission + settings facade |

Status strings: `GRANTED`, `DENIED`, `UNKNOWN`.

### Usage event collection (D2.2) — `usagestats/`

| Component | Role |
|-----------|------|
| `UsageStatsEventCollector` | `UsageStatsManager.queryEvents` for **[from, to)** when permission is `GRANTED` |
| `CollectedUsageEvent` | Native model: `packageName`, `timestamp`, `eventType` |

### React Native bridge (D2.3) — `bridge/`

| Item | Value |
|------|--------|
| **Registered module name** | `LostHoursUsageTracking` |
| **Package** | `LostHoursUsageTrackingPackage` (added in `MainApplication`) |
| **Methods** | `getPermissionStatus`, `openUsageAccessSettings`, `getUsageEvents` |

Bridge delegates to D2.1/D2.2. Event payloads: `{ packageName, timestamp, eventType }` with `timestamp` as JS `number` (double).

**Stable error codes:** `USAGE_PERMISSION_DENIED`, `USAGE_PERMISSION_UNKNOWN`, `USAGE_STATS_UNAVAILABLE`, `INVALID_TIME_RANGE`, `USAGE_STATS_QUERY_FAILED`, `USAGE_SETTINGS_UNAVAILABLE`.

**Not wired yet:** `AndroidUsageTrackingProvider` / UI (D2.4). Dashboard remains demo data.

No AccessibilityService.

## Planned

- **D2.4** — Provider + app runtime integration
- **D2.5** — Session Builder
- **D2.6** — SQLite persistence from live sessions
