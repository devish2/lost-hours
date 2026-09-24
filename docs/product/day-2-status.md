# Lost Hours — Day 2 status

Committed baseline: `6eb6aac` — *feat: establish Lost Hours mobile foundation*

Day 2 feature commit: `b413f38` — *feat(mobile): add Android usage tracking and live Today dashboard*

Post-validation fix (Metro / pnpm monorepo): separate follow-up commit on `main`.

## Checkpoints

| ID | Scope | Status |
|----|--------|--------|
| D2.1 | Android Usage Access (AppOps, settings) | Shipped in Day 2 |
| D2.2 | UsageStatsManager event collection | Shipped in Day 2 |
| D2.3 | React Native bridge `LostHoursUsageTracking` | Shipped in Day 2 |
| D2.4 | Tracking composition + permission UI | Shipped in Day 2 |
| D2.5 | Deterministic Session Builder | Shipped in Day 2 |
| D2.6 | SQLite persistence + opening-identity reconciliation | Shipped in Day 2 |
| D2.7 | Overlap queries + analytics clipping | Shipped in Day 2 |
| D2.8 | Live Today dashboard (foreground sync) | Shipped in Day 2 |
| D2.9 | Onboarding completion persistence + bootstrap | Shipped in Day 2 |
| D2.10 | Integration audit & hardening (automated) | Shipped in Day 2 |

## Architecture — usage pipeline

```
Android UsageStatsManager
        ↓
Native Kotlin collector
        ↓
RN bridge (LostHoursUsageTracking)
        ↓
UsageTrackingProvider
        ↓
UsageEvent[]
        ↓
Session Builder
        ↓
UsageSession[]
        ↓
SQLite (opening-identity reconciliation)
        ↓
findOverlapping
        ↓
clipUsageSessionsToWindow (analytics-only)
        ↓
Daily aggregation
        ↓
Lost Time (WASTE only)
        ↓
Today UI
```

## Architecture — app launch

```
App start
   ↓
AppBootstrapGate
   ↓
OnboardingStateRepository (AsyncStorage)
   ↓
if incomplete → Welcome
if complete → native getPermissionStatus()
   ↓
GRANTED → Main
DENIED/UNKNOWN → Usage Permission
```

**Permission grant is not persisted as truth.** Only `onboardingCompleted` is stored.

## Analytics note (overlap)

`totalTrackedMs` sums clipped session durations. Overlapping per-package sessions from Android are **not** deduplicated into wall-clock time in Day 2. Summed tracked time can exceed unique attention time when intervals overlap. See [overlap-analytics.md](../architecture/overlap-analytics.md).

## Physical Android validation

**PASSED** — completed on a physical Android device after Day 2 code landed on `main`.

Checklist reference: [day-2-physical-validation.md](./day-2-physical-validation.md).

### Device

- Physical Android phone (model **CPH2423**)
- Wireless debugging / ADB (no serials or network details recorded here)

### Build / runtime

- Canonical **Node v22.23.2**
- `./gradlew installDebug`: **PASS**
- Debug APK installed successfully
- Metro initially exposed a real monorepo resolution defect (`@babel/runtime/helpers/interopRequireDefault`)
- Fix: `@babel/runtime` as a production dependency + Metro `watchFolders` / `nodeModulesPaths` for the pnpm workspace (follow-up commit)
- Non-interactive Android Metro bundle validation: **PASS**
- Application launched successfully on device after the fix; no reproducible runtime warning at final validation

### Onboarding

- Clean app data → **Lost Hours** / **Get Started**
- **Get Started** → Usage Access onboarding
- **Continue** disabled while permission denied
- **Open Settings** → app-specific Android Usage Access page
- Android listed the app under Usage Access (Lost Hours mobile package)
- Enabling Usage Access detected on return; **Continue** enabled
- Completing onboarding → **Main** / **Today**

### Real usage collection

- **Today** showed real device usage (not demo data)
- Observed **Total Tracked** ~9h 15m initially; **Lost Hours** **0m**; **UNKNOWN** ~9h 15m
- Expected: sessions remain **UNKNOWN** until classification rules exist; **UNKNOWN ≠ WASTE**

### Idempotency / reconciliation

- Tracked total moved with real usage (~9h 15m → ~9h 20m → ~9h 22m) as foreground time accrued
- Repeated refresh did **not** multiply totals (~2× / ~3×); no duplicate accumulation observed

### Persistence

- Force-stop + relaunch → **Today** directly (no Welcome, no permission screen while grant held)
- Previously collected usage still available
- Validates onboarding persistence (AsyncStorage) and SQLite-backed usage at runtime

### Permission revocation

- Usage Access revoked after onboarding
- App showed Usage Access recovery (not Welcome); no crash
- **Open Settings** available; re-grant restored flow successfully

### Classification

- Collected sessions **UNKNOWN** where no classification evidence exists
- **Lost Hours** remained **0m**
- No Reels/Shorts/site/content inference introduced

### Limitations / notes

- **UsageStats** identifies foreground **apps**, not in-app content (e.g. which site is open in Chrome).
- Chrome time must **not** be labeled Facebook/Instagram/X based on possible site visits.
- Browser/site attribution is future Chrome-extension / browser work.
- **Not implemented in Day 2:** content-level tracking, AccessibilityService, background continuous tracking.

### Test context (not classification input)

Device had apps such as LinkedIn, Snapchat, WhatsApp, and Chrome installed during testing. This is environmental context only; Day 2 does not infer content or platform-specific WASTE rules from install presence.

## Non-goals retained

No background sync, WorkManager, AccessibilityService, classification defaults, content inference, cloud sync, or History live data in Day 2.
