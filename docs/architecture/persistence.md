# Usage session persistence (D2.6)

Persists `UsageSession[]` from the Session Builder into SQLite via `UsageSessionRepository`.

## Pipeline

```
UsageEventsPort
        ↓
CollectUsageSessions
        ↓
SessionBuilder
        ↓
UsageSession[]
        ↓
SyncUsageSessions
        ↓
UsageSessionRepository.saveManyWithOpeningReconciliation
        ↓
SQLite (usage_sessions)
```

## Bootstrap

- **`createInitializedStorage()`** — `initializeDatabase()` + `createSqliteRepositories()`.
- **Not** called from `App.tsx` in D2.6.
- **No** automatic/background sync (no timers, WorkManager, AppState hooks).

## Idempotency

- Primary key: session `id` (D2.5 deterministic string).
- Writes use `INSERT … ON CONFLICT(id) DO UPDATE` (existing UPSERT SQL).

Repeating the same session id updates the row — no duplicate ids.

## Opening reconciliation

D2.5 ids include `endTime`, so a window-truncated session and a later extended session differ in id:

| Sync | Session |
|------|---------|
| First | `10:50–11:00` (truncated) |
| Later | `10:50–11:07` (factual end) |

**Reconciliation key:** `trackingSource` + `packageName` + `startTime`.

Before upserting each session, delete rows matching that opening identity with a **different** id. Then upsert the new session — all inside one SQLite transaction per `saveManyWithOpeningReconciliation` call.

Does **not** delete unrelated sessions (different package, start, or tracking source).

## Failures

Collection, build, or repository errors propagate — no silent success, no partial fabricated persistence from failed collection.

## Read queries (D2.7)

See [queries.md](./queries.md). `GetUsageSessionsForRange` uses overlap semantics; reads never trigger sync.

## Today dashboard

Live Today (D2.8) reads persisted sessions after foreground sync. See [today-dashboard.md](./today-dashboard.md).
