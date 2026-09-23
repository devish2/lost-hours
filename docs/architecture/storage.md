# Storage architecture

Lost Hours persists structured analytics **on device** using SQLite. Cloud sync is out of scope for the MVP architecture.

## Library

| Item | Value |
|------|--------|
| Package | `@op-engineering/op-sqlite` |
| Version | **18.2.5** (pinned in `apps/mobile/package.json`) |

JSI-native SQLite with parameterized queries and migration support on React Native **0.87.1**.

## Database

- **File:** `lost_hours.db`
- **Versioning:** `PRAGMA user_version` + ordered migrations
- **Bootstrap:** `initializeDatabase()` (open, foreign keys, run migrations) — **not invoked from App.tsx in Day 1**

## Tables (v1)

| Table | Purpose |
|-------|---------|
| `usage_sessions` | Normalized session rows for analytics |
| `classification_rules` | User/system policy |
| `daily_usage_summaries` | Optional persisted daily rollups |

## Query semantics

| API | Semantics |
|-----|-----------|
| Session `findBetween(from, to)` | **`[from, to)`** on `startTime` (epoch ms) |
| Daily summary date range | **`YYYY-MM-DD`** local calendar strings, inclusive lexicographic range |

Repositories do not infer time zones or compute local midnights; callers supply bounded inputs.

## Safety and validation

- SQL uses **parameterized** statements.
- Enum columns are **validated on read** in mappers; corrupt values throw rather than silently defaulting.
- Transactions batch multi-row writes and migrations.

## Local-first behavior

Data remains on the device unless a future feature explicitly adds export/sync. No telemetry channel is defined in this layer.

## Implementation detail

Lower-level file paths, indexes, and mapper behavior:

[apps/mobile/src/infrastructure/storage/README.md](../../apps/mobile/src/infrastructure/storage/README.md)

## Day 1 status

Schema, repositories, and mappers are implemented and tested in Jest (with test doubles). **UI and App bootstrap do not read/write SQLite yet.**
