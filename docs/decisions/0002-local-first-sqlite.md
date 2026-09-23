# ADR 0002: Local-first SQLite storage

## Status

Accepted

## Context

Usage history and classification policy must remain on-device for privacy, offline use, and predictable analytics. The app needs queryable structured storage, not only in-memory aggregates.

## Decision

Use **SQLite** as the canonical local structured store via **`@op-engineering/op-sqlite`** (pinned **18.2.5**).

Database file: **`lost_hours.db`**. Schema version via **`PRAGMA user_version`** and ordered migrations.

## Consequences

**Positive**

- Local-first privacy alignment.
- Efficient range queries for sessions and daily summaries.
- Deterministic analytics replay from stored sessions.

**Negative**

- Native dependency and migration ownership.
- Jest tests mappers/migrations with doubles; full integration needs emulator/device.
- Backup/sync/export are future product decisions, not implied by this ADR.
