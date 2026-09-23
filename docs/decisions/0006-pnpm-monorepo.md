# ADR 0006: pnpm monorepo layout

## Status

Accepted

## Context

Lost Hours includes the mobile app, future extension, and shared packages. React Native Android builds are sensitive to `node_modules` layout; pnpm’s isolated store broke naive Gradle paths to `@react-native/gradle-plugin`.

## Decision

Use **pnpm workspaces** at the repository root:

- `apps/mobile` — primary React Native app (`lost-hours-mobile`)
- `apps/extension` — placeholder
- `packages/*` — shared libraries (placeholders)

Pin **`packageManager`: `pnpm@12.5.1`**. Use hoisted linking configuration appropriate for React Native (see root `.npmrc`).

For Android, resolve React Native Gradle tooling via Node **`require.resolve('@react-native/gradle-plugin/package.json', { paths: [require.resolve('react-native/package.json')] })`** in `apps/mobile/android/settings.gradle`, rather than hard-coded `../node_modules/.pnpm/...` paths.

Add explicit devDependencies on `@react-native/codegen` and `@react-native/gradle-plugin` aligned with the RN version (**0.87.1**).

## Consequences

**Positive**

- Single repo for mobile, docs, and future packages.
- Reproducible installs via pnpm lockfile.
- Gradle codegen tasks find CLI paths under the mobile app.

**Negative**

- Developers must use pnpm, not npm/yarn, for consistency.
- Monorepo + RN upgrades require verifying Android settings resolution again.
