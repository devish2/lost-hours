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
| **Methods** | `getPermissionStatus`, `openUsageAccessSettings`, `getUsageEvents`, `getAppMetadata` |

Bridge delegates to D2.1/D2.2. Event payloads: `{ packageName, timestamp, eventType }` with `timestamp` as JS `number` (double).

**Stable error codes:** `USAGE_PERMISSION_DENIED`, `USAGE_PERMISSION_UNKNOWN`, `USAGE_STATS_UNAVAILABLE`, `INVALID_TIME_RANGE`, `USAGE_STATS_QUERY_FAILED`, `USAGE_SETTINGS_UNAVAILABLE`, `APP_METADATA_QUERY_FAILED`.

### App metadata (D3.3) — `appmetadata/`

| Component | Role |
|-----------|------|
| `AppMetadataResolver` | Batch `PackageManager` labels for requested package names only |
| `AppMetadataRequestParser` | Dedupes/trims bridge input |
| `getAppMetadata` | Returns `{ packageName, displayName? }[]`; per-package failure omits label, not whole batch |

Labels use `PackageManager.getApplicationLabel` for package names supplied from UsageStats only.

**Package visibility (API 30+):** `AndroidManifest.xml` declares a `<queries>` MAIN/LAUNCHER intent so third-party launcher apps (Snapchat, Chrome, WhatsApp, etc.) can resolve labels without `QUERY_ALL_PACKAGES`.

No AccessibilityService.

## Planned

- **D2.4** — Provider + app runtime integration
- **D2.5** — Session Builder
- **D2.6** — SQLite persistence from live sessions
