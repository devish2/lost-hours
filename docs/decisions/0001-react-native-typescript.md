# ADR 0001: React Native and TypeScript for mobile

## Status

Accepted

## Context

Lost Hours needs a cross-platform mobile shell with strong typing, fast iteration, and access to Android system APIs for usage measurement. The team is Android-first for MVP.

## Decision

Use **React Native** with **TypeScript** for the mobile app (`apps/mobile`).

Reserve **Kotlin** for Android-native modules that require platform APIs (e.g. future `UsageStatsManager` bridge). Do not assume iOS usage-tracking parity in MVP scope.

## Consequences

**Positive**

- Shared presentation and domain logic in TypeScript.
- Large ecosystem for navigation, testing, and tooling.
- Clear seam for native modules where RN alone is insufficient.

**Negative**

- Native build complexity (Gradle, Hermes, New Architecture).
- Jest cannot fully substitute device validation for SQLite and navigation.
- iOS remains presentation-capable but not a tracking target for Day 1.
