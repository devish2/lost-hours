# Navigation

## Root stack

**D2.9:** `AppBootstrapGate` picks the initial root route after reading onboarding persistence and live Usage Access. See [onboarding-bootstrap.md](../../../../docs/architecture/onboarding-bootstrap.md).

```
First launch: Welcome → UsagePermission → Main
Returning + granted: Main
Returning + revoked: UsagePermission (not Welcome)
```

- **Welcome** — product intro; navigates to usage permission setup.
- **UsagePermission** — checks Usage Access via `UsageTrackingProvider`; opens Android Settings; Main requires **GRANTED**.
- **Main** — bottom tab shell.

## Main tabs

Initial tab: **Today**

| Tab | Screen |
|-----|--------|
| Today | Placeholder dashboard |
| History | Placeholder history |
| Settings | Placeholder settings |

Route names and param lists: `routeNames.ts`, `navigationTypes.ts`.
