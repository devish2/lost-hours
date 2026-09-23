# Data flow

Two pipelines: **what exists today (Day 1 demo)** and **planned Android integration**.

## Current Day-1 demo flow (implemented)

```
Demo UsageSession[]  (features/dashboard/demo)
        ↓
GetTodayDashboard  (application)
        ↓
DefaultDailyUsageAggregator  +  DefaultLostTimeCalculator  (domain)
        ↓
TodayDashboardModel
        ↓
TodayScreen  (presentation)
```

- No SQLite reads for the Today dashboard.
- No `UsageTrackingProvider` calls from UI.
- Totals are **computed**, not hard-coded in JSX.

## Future real Android flow (planned — not implemented)

```
Android UsageStatsManager  (Kotlin — planned)
        ↓
Native usage module  (planned)
        ↓
NativeUsageTrackingModule  (transport)
        ↓
AndroidUsageTrackingProvider  (TypeScript — adapter exists)
        ↓
UsageEvent[]
        ↓
Session Builder  (planned)
        ↓
UsageSession[]
        ↓
RuleBasedActivityClassifier  (domain)
        ↓
SQLite repositories  (infrastructure — implemented, not wired to UI)
        ↓
Application queries  (partial: GetTodayDashboard pattern)
        ↓
UI
```

**Explicitly not implemented yet:**

- Kotlin `UsageStatsManager` integration
- Session Builder (events → sessions)
- Real permission flow and onboarding persistence
- Dashboard fed from device/SQLite data

The TypeScript `AndroidUsageTrackingProvider` and SQLite layer exist as **architecture and tests**; end-to-end live data is Day 2+.
