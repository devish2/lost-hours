import type { Migration } from './Migration';

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS usage_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    package_name TEXT NOT NULL,
    app_display_name TEXT NULL,
    platform TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    classification TEXT NOT NULL,
    classification_source TEXT NOT NULL,
    classification_confidence REAL NULL,
    tracking_source TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_usage_sessions_start_time
    ON usage_sessions (start_time)`,
  `CREATE INDEX IF NOT EXISTS idx_usage_sessions_platform
    ON usage_sessions (platform)`,
  `CREATE INDEX IF NOT EXISTS idx_usage_sessions_classification
    ON usage_sessions (classification)`,
  `CREATE INDEX IF NOT EXISTS idx_usage_sessions_package_name
    ON usage_sessions (package_name)`,
  `CREATE TABLE IF NOT EXISTS classification_rules (
    id TEXT PRIMARY KEY NOT NULL,
    platform TEXT NULL,
    content_type TEXT NULL,
    package_name TEXT NULL,
    classification TEXT NOT NULL,
    source TEXT NOT NULL,
    priority INTEGER NOT NULL,
    enabled INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS daily_usage_summaries (
    date TEXT PRIMARY KEY NOT NULL,
    total_tracked_ms INTEGER NOT NULL,
    productive_ms INTEGER NOT NULL,
    neutral_ms INTEGER NOT NULL,
    leisure_ms INTEGER NOT NULL,
    waste_ms INTEGER NOT NULL,
    unknown_ms INTEGER NOT NULL,
    session_count INTEGER NOT NULL,
    longest_session_ms INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
];

export const migration001Initial: Migration = {
  version: 1,
  async up(executor) {
    for (const statement of STATEMENTS) {
      await executor.execute(statement);
    }
  },
};
