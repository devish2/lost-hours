# Session Builder (D2.5)

Converts factual `UsageEvent[]` into temporal `UsageSession[]`. Pure domain logic — no native APIs, SQLite, or UI.

Code: `DefaultUsageSessionBuilder` in `apps/mobile/src/domain/session/`.

## Pipeline position

```
UsageStatsManager (Android)
        ↓
UsageEvent[]
        ↓
Session Builder
        ↓
UsageSession[]
```

Persistence: **D2.6** (`SyncUsageSessions`). Live Today: **D2.8**.

## API

```typescript
buildSessions(events, fromTimestamp, toTimestamp): readonly UsageSession[]
```

Processing window: **[fromTimestamp, toTimestamp)** on event timestamps and session bounds.

## Policies

| Case | Behavior |
|------|----------|
| Normal pair | `FOREGROUND` opens; matching `BACKGROUND` closes → session `[t1, t2)` |
| Orphan `BACKGROUND` | Ignored (no invented start) |
| Unmatched `FOREGROUND` at window end | Close at `toTimestamp` (window-truncated; no factual background) |
| Duplicate `FOREGROUND` (same package) | Keep earliest open timestamp |
| Duplicate `BACKGROUND` | First closes; later backgrounds ignored as orphan |
| App switch / overlap | Per-package matching; overlapping sessions allowed |
| Unsorted input | Sorted inside builder |
| Sort tie-break | Timestamp ↑, then `FOREGROUND` before `BACKGROUND`, then `packageName` ↑ |
| Same timestamp FG+BG | Zero duration discarded |
| Out-of-window events | Filtered out |
| `UNKNOWN` event type | Ignored for session construction |
| Invalid events | Negative timestamp or blank `packageName` skipped |
| Invalid window | `from >= to` or negative bounds → throw |

## Session fields

| Field | D2.5 value |
|-------|------------|
| `id` | Deterministic: `trackingSource\|packageName\|startTime\|endTime` |
| `platform` | `PlatformResolver` (`PackageNamePlatformResolver` default) |
| `contentType` | `UNKNOWN` (no content inference) |
| `classification` | `UNKNOWN` |
| `classificationSource` | `UNKNOWN` |
| `trackingSource` | Preserved from opening foreground event |

## Application orchestration

`CollectUsageSessions` (`application/use-cases/`) calls a `UsageEventsPort` then the builder. Does **not** write SQLite.

## Today dashboard

Today uses live sessions via D2.8 (see [today-dashboard.md](./today-dashboard.md)).
