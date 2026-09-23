# Navigation

## Root stack

Development initial route: **Welcome** (onboarding completion is not persisted yet).

```
Welcome → UsagePermission → Main
```

- **Welcome** — product intro; navigates to usage permission setup.
- **UsagePermission** — presentation-only; does not call Android tracking APIs.
- **Main** — bottom tab shell.

## Main tabs

Initial tab: **Today**

| Tab | Screen |
|-----|--------|
| Today | Placeholder dashboard |
| History | Placeholder history |
| Settings | Placeholder settings |

Route names and param lists: `routeNames.ts`, `navigationTypes.ts`.
