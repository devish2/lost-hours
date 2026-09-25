# Local storage (Lost Hours mobile)

Lost Hours is **local-first**. Structured usage history lives in on-device SQLite only — no cloud sync, telemetry, or remote backup in this layer.

## SQLite library

| Item | Value |
|------|--------|
| Package | [`@op-engineering/op-sqlite`](https://github.com/OP-Engineering/op-sqlite) |
| Version | **18.2.5** (pinned in `apps/mobile/package.json`) |

**Why:** JSI-native SQLite with parameterized queries, transactions, iOS/Android support, active maintenance, and New Architecture / bridgeless compatibility on recent React Native releases (0.74+; project uses **0.87.1**).

**Caveats:** Native module — Jest runs mapper/migration-runner unit tests only; full repository behavior should be validated on device/emulator. Optional `iosSqlite` / `use_frameworks` Podfile tweaks may be required for some iOS setups (see op-sqlite docs).

**pnpm monorepo (Android):** `apps/mobile/android/settings.gradle` resolves `@react-native/gradle-plugin` via Node (`require.resolve` from `react-native`). Direct devDependencies on `@react-native/codegen` and `@react-native/gradle-plugin` (0.87.1) ensure Gradle codegen tasks find CLI paths under `apps/mobile/node_modules`.

**Alternatives considered:** `react-native-quick-sqlite` (predecessor ecosystem, less active), `react-native-sqlite-storage` (legacy bridge, weak New Architecture story). No ORM (Drizzle/TypeORM/Prisma).

## Database

- **File:** `lost_hours.db` (`databaseConfig.ts`)
- **Versioning:** `PRAGMA user_version` + ordered migrations in `sqlite/migrations/`
- **Bootstrap:** `initializeDatabase()` — open → `PRAGMA foreign_keys = ON` → `runMigrations()`

## Schema (v1)

### `usage_sessions`

Session metadata for attention analytics (no message content, screenshots, or page text).

Indexes: `start_time`, `platform`, `classification`, `package_name`.

### `classification_rules`

User/system classification policy rows (`enabled` stored as 0/1).

**D3.5:** App-level user classifications via `getAppUserClassification()` → `AppUserClassification` → `classificationRules` repository (stable `user-app:<packageName>` upsert; clear deletes row). Shares `getAppStorage()` with session sync — no second DB connection.

### `daily_usage_summaries`

One row per local calendar date (`YYYY-MM-DD` string, no timezone conversion in persistence).

## Repositories

Contracts (domain types only): `domain/repositories/`.

Implementations: `sqlite/repositories/` — `SQLite*Repository` with UPSERT saves.

| Query | Semantics |
|-------|-----------|
| `UsageSessionRepository.findBetween(from, to)` | `startTime >= from` **and** `startTime < to` (**[from, to)** on start) |
| `UsageSessionRepository.findOverlapping(from, to)` | `startTime < to` **and** `endTime > from` (interval overlap) |
| `DailyUsageSummaryRepository.findBetweenDates(from, to)` | `fromDate <= date <= toDate` (lexicographic on `YYYY-MM-DD`) |

Callers supply date-bounded sessions/summaries; repositories do not compute local midnights.

## Mappers

`sqlite/mappers/` convert snake_case rows ↔ domain models. Enum columns are validated on read (`parseStoredEnums.ts`); corrupt values **throw** — they are not silently coerced to `OTHER` or `UNKNOWN`.

## Transactions

- `saveMany` on session and rule repositories uses a single SQLite transaction.
- `saveManyWithOpeningReconciliation` (D2.6) runs delete-derived-variant + upsert per session inside one transaction.
- Each pending migration runs inside a transaction; failures abort without advancing `user_version`.

## Sync pipeline (D2.6)

- `createInitializedStorage()` — explicit DB + repository bootstrap (not App auto-start).
- `createSyncUsageSessionsPipeline({ usageEventsPort, usageSessionRepository, appMetadataPort? })` → `SyncUsageSessions` (optional label enrichment before persist).
- Idempotent by session id; reconciles truncated→extended variants by opening identity (`trackingSource`, `packageName`, `startTime`).
- No automatic background sync in D2.6.

## Read queries (D2.7)

- `createUsageSessionQueries({ usageSessionRepository })` → `GetUsageSessionsForRange` (overlap reads).
- `clipUsageSessionsToWindow` (domain) — analytics-only; not persisted.
- Reads do not trigger sync by themselves. **D2.8:** `getAppStorage()` memoizes `createInitializedStorage()` once per runtime; Today foreground refresh runs sync then overlap read.

## Testing

- **Jest:** mapper round-trips, enum parse failures, migration runner ordering (mock `SqlExecutor`).
- **Device/emulator:** recommended for native SQLite integration and Gradle-built APK.

## Privacy

Database stays on device. Do not store DM contents, typed text, or page HTML — only normalized session/rule/summary fields required for Lost Hours analytics.
