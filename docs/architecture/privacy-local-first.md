# Privacy and local-first MVP (Day 3)

This document describes **what the current Lost Hours mobile codebase does on device**. It is not a legal privacy policy.

## Stored locally

- **Usage sessions** derived from Android `UsageStats` (package, timestamps, duration, sync-time classification fields).
- **Classification rules** in SQLite (`classification_rules`), including app-level `USER_RULE` rows keyed by `packageName`.
- **Optional app display labels** from Android `PackageManager` when lookup succeeds (`displayName` on sessions).

## Not collected (Day 3 scope)

- Browser URLs, history, or tab titles
- Screen contents or AccessibilityService data
- Notification bodies, typed text, clipboard, contacts, messages, media, accounts, or location
- Cloud sync, remote classification, or ML/AI labeling

## Android permissions (app manifest)

| Permission | Purpose |
|------------|---------|
| `PACKAGE_USAGE_STATS` | Read aggregated app foreground usage (Usage Access) |
| `INTERNET` | React Native / Metro dev tooling (standard RN template) |

**Package visibility (API 30+):** a `<queries>` MAIN/LAUNCHER intent allows `PackageManager` to resolve **labels** for launcher apps whose package names already appear in UsageStats. This is **not** `QUERY_ALL_PACKAGES` and does not enumerate unrelated apps.

No broad storage, accessibility, or network analytics permissions.

## User classification

- Judgments are **explicit** (Today chooser → `AppUserClassification`).
- No automatic “social apps = waste” defaults in production paths.
- Uninstalling an app does **not** delete historical usage rows or existing rules; missing labels fall back to `packageName`.

## Analytics boundary

Effective classification and Today totals are computed at **read time** from stored sessions + enabled rules. Raw sessions are not rewritten when rules change.

## Browser (Chrome)

`com.android.chrome` is one **package-level** row (`Platform.OTHER`). The app does not infer Instagram/Facebook/X/etc. from Chrome usage.
