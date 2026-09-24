# Stored usage session queries (D2.7)

Read path over persisted sessions. No SQLite in application code; no sync on read.

## Pipeline

```
SQLite
        ↓
UsageSessionRepository
        ↓
GetUsageSessionsForRange
        ↓
UsageSession[] (stored intervals, unclipped)
```

Write path (D2.6) remains separate — reads do **not** call `SyncUsageSessions`.

## Window contract

Queries use half-open **[fromTimestamp, toTimestamp)** with the same validation as session building (`validateSessionProcessingWindow`).

## Two repository range semantics

| Method | Meaning |
|--------|---------|
| `findBetween(from, to)` | **Start-time** filter: `startTime >= from` AND `startTime < to` (unchanged) |
| `findOverlapping(from, to)` | **Overlap** filter: `startTime < to` AND `endTime > from` |

`GetUsageSessionsForRange` uses **`findOverlapping`** for analytics-oriented reads.

Boundary examples (half-open):

- Session ends exactly at query start → **no** overlap
- Session starts exactly at query end → **no** overlap

## Ordering

`findOverlapping` returns rows ordered by:

`startTime ASC`, `endTime ASC`, `packageName ASC`, `id ASC`

## Raw sessions vs analytics clipping

Range queries return **stored** `UsageSession` objects unchanged (e.g. `09:55–10:10` stays that way for query `10:00–11:00`).

For day/window analytics (D2.8), use pure **`clipUsageSessionsToWindow`** — produces analytics-only views with derived ids (`{storedId}|clip:{from}:{to}`). **Do not persist** clipped rows.

Cross-midnight: overlap query retrieves the full stored session; clipping counts only the portion inside the day window.

## Composition

- `createInitializedStorage()` — DB + repositories (explicit)
- `createUsageSessionQueries({ usageSessionRepository })` — read queries

Not invoked from `App.tsx` or Today in D2.7.

## Errors

Repository failures propagate. Empty array means success with no matching sessions.

## Today dashboard

D2.8: Today uses this read path after sync. See [today-dashboard.md](./today-dashboard.md).
