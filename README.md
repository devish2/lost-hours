# Lost Hours

Lost Hours helps users understand where their digital time goes and how much of it is classified as **Lost Time**.

The project is **Android-first**, built with **React Native** and **TypeScript**, **local-first**, and **privacy-conscious**. It is in **MVP development**: core domain logic, persistence architecture, and a demo dashboard exist; **real Android usage tracking is not implemented yet**.

## Product idea

Three questions drive the architecture:

| Layer | Question |
|-------|----------|
| **Tracking** | What happened? (foreground events, durations, apps) |
| **Classification** | What kind of activity was it? (PRODUCTIVE, NEUTRAL, LEISURE, WASTE, UNKNOWN) |
| **Analytics** | What does that mean for my time? (Tracked Time, Lost Time, daily breakdown) |

For the MVP, **Lost Time** is the sum of session duration where classification is **WASTE**.

Important distinctions:

- **Tracked Time** ≠ **Lost Time**
- **LEISURE** ≠ **WASTE**
- **UNKNOWN** is a valid outcome when policy does not apply

See [docs/product/mvp.md](docs/product/mvp.md) for product scope.

## Repository structure

```
lost-hours/
├── apps/
│   ├── mobile/          # React Native app (primary)
│   └── extension/       # Chrome extension placeholder (future)
├── packages/            # Shared packages (placeholders for later)
├── docs/                # Product and architecture documentation
└── scripts/             # Tooling scripts
```

The browser extension is **not implemented**; the folder documents future intent only.

## Mobile architecture

Dependencies flow inward:

```
Presentation  →  Application  →  Domain
Infrastructure  →  Domain
```

- **Presentation** — React Native screens, navigation, formatting (`apps/mobile/src/features`, `src/app`, `src/shared`).
- **Application** — use-case composition (`apps/mobile/src/application`), e.g. `GetTodayDashboard`.
- **Domain** — models, classification, analytics, repository **contracts** (`apps/mobile/src/domain`). No React Native or SQLite imports.
- **Infrastructure** — SQLite repositories, usage tracking providers (`apps/mobile/src/infrastructure`).

Details: [docs/architecture/overview.md](docs/architecture/overview.md).

## Current Day-1 implementation

| Area | Status |
|------|--------|
| Domain models (`UsageSession`, `UsageEvent`, rules, summaries) | Implemented |
| Rule-based classification engine | Implemented |
| Lost Time calculator (WASTE-only MVP) | Implemented |
| Daily usage aggregator | Implemented |
| SQLite persistence (migrations, repositories, mappers) | Implemented; **not wired to App bootstrap or UI** |
| `UsageTrackingProvider` boundary + mock/Android TS adapter | Implemented; **no Kotlin / UsageStatsManager** |
| Navigation (onboarding → tabs) | Implemented |
| Today dashboard (demo data → domain calculators → UI) | Implemented |

**Not built yet:** Android `UsageStatsManager` integration, session builder, real permission flow, onboarding persistence, live dashboard from device data.

## Development

**Requirements:** Node **≥ 22.13** (see root `engines`), **pnpm** (version in `packageManager`: `pnpm@12.5.1`).

```bash
pnpm install

pnpm mobile:lint
pnpm mobile:typecheck
pnpm mobile:test
# or: pnpm --filter lost-hours-mobile test --watchman=false
```

Start Metro:

```bash
pnpm mobile:start
```

Run on Android (device/emulator):

```bash
pnpm mobile:android
```

## Android

Debug APK:

```bash
cd apps/mobile/android
./gradlew assembleDebug
```

Application ID: **`com.aevora.losthours`**

Gradle resolves React Native tooling via Node `require.resolve` from the mobile app (pnpm monorepo); see ADR 0006.

## Testing

- **Domain and application** logic are covered by Jest unit tests under `apps/mobile`.
- **Native SQLite and full navigation** are limited in Jest; mappers/migrations use test doubles; device/emulator validation is recommended for native integration.

## Privacy

The MVP architecture stores usage analytics **locally in SQLite** on device. Settings copy reflects current behavior; future optional sync or cloud features are **not** promised in this documentation.

Architecture decisions: [docs/decisions/](docs/decisions/).
