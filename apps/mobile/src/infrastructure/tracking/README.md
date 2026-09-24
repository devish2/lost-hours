# Usage tracking (infrastructure)

Lost Hours retrieves **facts** about app usage through a `UsageTrackingProvider`. Tracking does not classify activity, calculate Lost Time, or write to SQLite.

## Contract

`UsageTrackingProvider`:

- `getPermissionStatus()` — normalized usage-access state (`GRANTED` | `DENIED` | `UNKNOWN`)
- `openPermissionSettings()` — opens platform Usage Access settings
- `getUsageEvents(fromTimestamp, toTimestamp)` — domain `UsageEvent[]` for **[from, to)** (epoch ms)

Requires `fromTimestamp < toTimestamp` or the provider throws.

## Composition (D2.4)

`createUsageTrackingComposition()` is the single app entry point:

| Platform / module | Result |
|-------------------|--------|
| Android + `LostHoursUsageTracking` registered | `ANDROID_NATIVE` → `AndroidUsageTrackingProvider` |
| Android, module missing | `ANDROID_NATIVE_UNAVAILABLE` (no mock fallback) |
| Non-Android | `UNSUPPORTED_PLATFORM` |

Wired in `UsageTrackingProvider` context inside `AppProviders`.

## Providers

| Provider | Role |
|----------|------|
| `MockUsageTrackingProvider` | Tests only — deterministic events + permission |
| `AndroidUsageTrackingProvider` | Maps native module → domain |

Application flow:

```
UsageTrackingProvider → UsageEvent[] → Session Builder (D2.5) → UsageSession[] → …
```

`CollectUsageSessions` orchestrates port + builder; **no SQLite in D2.5**. Do not persist raw events directly from the provider.

## Native boundary

`NativeUsageTrackingModule` / `NativeUsageEvent` are **transport types**. TypeScript maps native strings to domain enums.

- Domain events from Android use `TrackingSource.ANDROID_USAGE_STATS` (set by the provider, not native).
- Unrecognized native event types → `UsageEventType.UNKNOWN`.
- Unrecognized permission strings → `UsageTrackingPermissionStatus.UNKNOWN`.

### Android native (Day 2)

**D2.1:** Usage Access permission + settings (`usageaccess/`).

**D2.2:** `UsageStatsEventCollector` — factual foreground/background events.

**D2.3:** RN module **`LostHoursUsageTracking`**.

**D2.4:** Permission UI + provider composition (see architecture docs).

**D2.5:** Session Builder (`UsageEvent[]` → `UsageSession[]`).

**D2.6 (current):** `SyncUsageSessions` persists sessions via `UsageSessionRepository.saveManyWithOpeningReconciliation`. Storage bootstrap: `createInitializedStorage()`. **Not auto-synced; Today still demo.**

**Important:** UsageStatsManager does not identify Reels, Shorts, feeds, or DMs. Builder persists `contentType` / `classification` as **UNKNOWN** unless input already carries values.

**Planned:** D2.7 stored-session queries → D2.8 live Today.
