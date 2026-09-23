# Usage tracking (infrastructure)

Lost Hours retrieves **facts** about app usage through a `UsageTrackingProvider`. Tracking does not classify activity, calculate Lost Time, or write to SQLite.

## Contract

`UsageTrackingProvider`:

- `getPermissionStatus()` — normalized usage-access state (`GRANTED` | `DENIED` | `UNKNOWN`)
- `openPermissionSettings()` — opens platform settings (real behavior deferred to Kotlin)
- `getUsageEvents(fromTimestamp, toTimestamp)` — domain `UsageEvent[]` for **[from, to)** (epoch ms)

Requires `fromTimestamp < toTimestamp` or the provider throws.

## Providers

| Provider | Role |
|----------|------|
| `MockUsageTrackingProvider` | Deterministic events + permission for tests/dev (no network/native) |
| `AndroidUsageTrackingProvider` | Maps `NativeUsageTrackingModule` → domain; inject module in constructor |

Future application flow:

```
UsageTrackingProvider → UsageEvent[] → Session Builder (later) → UsageSession → …
```

Do not skip session building or persist raw events directly from the provider.

## Native boundary

`NativeUsageTrackingModule` / `NativeUsageEvent` are **transport types only**. Kotlin (Day 2+) will normalize Android APIs to string event types (`FOREGROUND`, `BACKGROUND`, …) and permission strings before TypeScript maps them to domain enums.

- Domain events from Android use `TrackingSource.ANDROID_USAGE_STATS` (set by the provider, not native).
- Unrecognized native event types → `UsageEventType.UNKNOWN` (legitimate OS variance).
- Unrecognized permission strings → `UsageTrackingPermissionStatus.UNKNOWN`.

No `UsageStatsManager`, AccessibilityService, or Kotlin implementation in this phase.
