# Usage tracking architecture

Tracking records **facts** about app usage. It does **not** classify activity, calculate Lost Time, or persist `UsageSession` rows.

Code: `apps/mobile/src/infrastructure/tracking`.

## Contract: `UsageTrackingProvider`

| Method | Purpose |
|--------|---------|
| `getPermissionStatus()` | Normalized access state |
| `openPermissionSettings()` | Open system settings (native behavior deferred) |
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
| `MockUsageTrackingProvider` | Implemented — deterministic events for tests/dev |
| `AndroidUsageTrackingProvider` | TypeScript adapter over `NativeUsageTrackingModule` |

## Native boundary

`NativeUsageTrackingModule` / `NativeUsageEvent` are **transport types**. Planned Kotlin code will wrap Android APIs and emit normalized strings before TypeScript maps to domain enums.

Domain events from Android use `TrackingSource.ANDROID_USAGE_STATS` (set in the TypeScript provider).

## Explicitly deferred (Day 2+)

- Kotlin **`UsageStatsManager`** implementation
- Real permission UI wiring from onboarding
- **AccessibilityService** (not planned for Day 1)
- **Session Builder** (UsageEvent[] → UsageSession[])

## Intended future pipeline

```
UsageTrackingProvider → UsageEvent[] → Session Builder → classify → SQLite → application queries → UI
```

Only the provider boundary and domain types exist end-to-end today; session building and native Android code do not.

More detail: [apps/mobile/src/infrastructure/tracking/README.md](../../apps/mobile/src/infrastructure/tracking/README.md)
