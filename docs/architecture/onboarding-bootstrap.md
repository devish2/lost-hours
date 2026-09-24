# Onboarding bootstrap (D2.9)

Cold start routing combines **persisted onboarding completion** with a **live** Android Usage Access check. Permission grant is never stored as authoritative state.

## Flow

```
App start
   ↓
AppBootstrapGate (bootstrapping UI)
   ↓
OnboardingStateRepository.isOnboardingCompleted()
   ↓
incomplete → Welcome
   ↓
complete → UsageTrackingProvider.getPermissionStatus()
   ↓
GRANTED → Main
DENIED / UNKNOWN → Usage Permission
native unavailable / unsupported → Usage Permission (recoverable)
```

## Persistence

| Stored | Meaning |
|--------|---------|
| `onboardingCompleted = true` | User finished Welcome + granted Usage Access and continued to Main at least once |

| Not stored as truth | Source |
|---------------------|--------|
| Usage Access granted | Android AppOps / native `getPermissionStatus()` every bootstrap |

Implementation: `@react-native-async-storage/async-storage` behind `OnboardingStateRepository` (domain contract). Not in usage-session SQLite.

## Completion timing

1. User grants Usage Access (native GRANTED).
2. User taps Continue on Usage Permission.
3. Re-check permission.
4. `markOnboardingCompleted()` **before** navigation reset to Main.
5. Write failure → error on Permission screen; **no** Main navigation.

Welcome **does not** mark completion.

## Navigation

- Bootstrap mounts `RootNavigator` only after destination is resolved (avoids Welcome/Main flash).
- Continue to Main uses stack **reset** so Welcome is not under Main in history.

## Errors

| Failure | Behavior |
|---------|----------|
| Read onboarding state | Safe fallback → Welcome |
| Write onboarding completion | Stay on Permission; retry Continue |

## Not in D2.9

- Background sync or WorkManager
- Persisting permission grant
- Today/History redesign

Physical device validation for Day 2 remains **deferred** until after D2.10 implementation.
