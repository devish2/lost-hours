# Historical analytics architecture (Day 4)

Day 4 extends the Day 3 pipeline from **Today (elapsed local day)** to **arbitrary local date windows** without new native analytics or UI→SQLite access.

## Layered semantics

```text
Tracking fact → Classification (effective) → Historical aggregation → Pattern → Projection
```

| Layer | Location | Mutates `usage_sessions`? |
|-------|----------|---------------------------|
| Tracking fact | Domain session builder + SQLite | Writes on sync only |
| Effective classification | Application (`applyEffectiveClassificationToUsageSessions`) | **No** |
| Daily / weekly aggregation | Domain aggregators + application queries | **No** |
| Pattern (e.g. peak period) | Application read models (future) | **No** |
| Pace projection | Domain (`computePaceProjection`) | **No** |

## D4.2 — Historical date-window analytics (implemented)

Read-only pipeline for an explicit half-open window **`[fromTimestamp, toTimestamp)`** (epoch ms). Caller converts calendar dates to boundaries; the query does not call `Date.now()` or sync UsageStats.

```text
Persisted UsageSession
        ↓
UsageSessionRepository.findOverlapping([from, to))   (via GetUsageSessionsForRange)
        ↓
clipUsageSessionsToWindow                            (domain)
        ↓
ClassificationRuleRepository.findEnabled()
        ↓
applyEffectiveClassificationToUsageSessions            (application, current-effective)
        ↓
DefaultDailyUsageAggregator + DefaultLostTimeCalculator
        ↓
HistoricalUsageAnalyticsModel                          (application read model)
```

**Historical read ≠ sync.** `GetHistoricalUsageAnalyticsForRange` never invokes `SyncUsageSessions` or native tracking. `RefreshTodayDashboard` may sync because Today is a live view.

Application entry points:

- `GetHistoricalUsageAnalyticsForRange`
- `createGetHistoricalUsageAnalyticsForRange(repositories)` — composition helper (no UI wiring in D4.2)

Half-open semantics match Day 3: overlap when `startTime < toTimestamp` and `endTime > fromTimestamp`; clip to `[from, to)`.

## D4.3 — Daily historical aggregation (implemented)

After D4.2 produces **effective clipped sessions** for `[from, to)`:

```text
effectiveSessions (already clipped to outer window)
        ↓
clipUsageSessionToLocalCalendarDayPieces   (domain, local midnight splits)
        ↓
DefaultDailyUsageAggregator + DefaultLostTimeCalculator per local day
        ↓
HistoricalDailyAnalyticsItem[]             (ascending dayStartTimestamp)
```

Application entry: `GetHistoricalDailyAnalyticsForRange` composes `GetHistoricalUsageAnalyticsForRange` → `aggregateEffectiveSessionsByLocalCalendarDay`. No second storage query.

**Local calendar semantics:** uses `getLocalCalendarDayStart` / `getNextLocalCalendarDayStart` (same as Today and D4.1 baseline). **No** `timestamp / 86_400_000` and **no** fixed 24-hour day length.

**Empty-day policy (MVP):** only days with **valid tracked usage** appear. Zero-evidence calendar days are **not** fabricated. History UI may synthesize “no usage” labels later.

**Midnight:** sessions crossing local midnight contribute duration to **each** day via clip; classification is preserved on each piece.

**Reconciliation:** per-day classification ms sums equal `trackedDurationMs`; sum of daily tracked/lost equals D4.2 range totals for the same window and rules.

**Still current-effective** (ADR 0007). History UI, weekly rollups, and Time Receipt UI are **not** part of D4.3.

## D4.5 — History screen (read-only)

Application query **`GetHistory`** composes:

```text
getRecentLocalCalendarHistoryWindow(now, days=30)
        ↓
GetHistoricalDailyAnalyticsForRange   (recent window only)
        +
GetBaselineProgress                   (full persisted history)
        ↓
HistoryModel (days newest-first for UI)
```

- **History window:** default **30 local calendar dates** including Today (`[from, to)` via calendar math, not `now - 30×24h`).
- **Baseline window:** all persisted sessions (`findAllChronological`) — **not** the same as History.
- **No UsageStats sync** on History refresh; Today remains the live/sync surface.
- **Zero-evidence days omitted** (D4.3 policy); empty History shows a factual empty state.
- **Presentation:** `formatHistoryDayLabel` (Today / Yesterday / short date), `formatDuration` (shared with Today).
- **Time Receipt UI** not implemented; `isFirstTimeReceiptEligible` ⇔ baseline `READY` only.

## D4.6 — Day Detail (read-only per-app breakdown)

Navigation: **History → tap observed day → Day Detail**. Route param is **`dayStartTimestamp` only** (local calendar day start). Day Detail re-queries persisted analytics on load/refresh so **current-effective** rules apply even if History was loaded earlier.

```text
dayStartTimestamp
        ↓
getLocalCalendarDayAnalyticsWindow → [dayStart, nextDayStart)
        ↓
GetHistoricalUsageAnalyticsForRange   (D4.2, clip + effective classification)
        ↓
aggregateUsageByApp                   (domain, shared with Today dashboard)
        ↓
HistoricalDayDetailModel
```

- **Grouping identity:** `packageName` only. `displayName` is presentation metadata. Duplicate display names across packages remain separate rows. Chrome stays package-level; no website/URL inference.
- **Mixed classification:** same semantics as Today (`hasMixedClassification`, optional single `classification` when unanimous).
- **Reconciliation:** Σ app `trackedDurationMs` = day `trackedDurationMs`; Σ app `lostDurationMs` = day `lostDurationMs`; category ms sums match tracked (daily aggregator + lost calculator).
- **Midnight:** D4.2 clip before aggregation; no separate Day Detail midnight math.
- **Empty day:** success with zeros and `apps: []` — not an error.
- **No UsageStats sync**, no native tracking, no classification editing on Day Detail (Today remains the management surface).
- **Future reuse:** `aggregateUsageByApp` is range-independent and intended for later Time Receipt “where did Lost Hours go?” breakdowns (Time Receipt not implemented).

## Later Day 4 pipeline (not yet implemented)

```text
weekly / Time Receipt read models  (application, future UI)
        ↓
computeBaselineProgress            (domain, evidence for receipt eligibility)
        ↓
computePaceProjection              (domain, on computed Lost totals)
```

## Storage and queries (Day 3 baseline)

- **Timestamps:** `start_time`, `end_time`, `duration_ms` on `usage_sessions` support window overlap and clipping.
- **Overlap query:** `findOverlapping` — `start_time < to AND end_time > from` (half-open `[from, to)`).
- **Alternate:** `findBetween` — sessions whose **start** falls in `[from, to)` (not used for Today refresh).
- **Application entry:** `GetUsageSessionsForRange` → `findOverlapping` only; no sync/classify/clip inside the query.

## Clipping

- **Domain:** `clipUsageSessionToWindow` / `clipUsageSessionsToWindow`
- Clipped rows are analytics views; synthetic ids (`|clip:from:to`); **not** persisted.
- Today uses the same clipper after sync (`RefreshTodayDashboard`).

## Effective classification

- **Application:** `applyEffectiveClassificationToUsageSessions`
- Uses current enabled rules from `ClassificationRuleRepository` and `RuleBasedActivityClassifier`.
- **Historical MVP (ADR 0007):** always **current-effective**, not as-at-session-time.
- Persisted `usage_sessions.classification` remains sync-time default (typically UNKNOWN), not authoritative user judgment.

## Baseline readiness

- **Domain:** `computeBaselineProgress` from valid sessions + configurable `targetCalendarDays` (default 7).
- **Application (D4.4):** `GetBaselineProgress` → `findAllChronological()` on persisted sessions → `computeBaselineProgress` (no sync, no classification query).
- Counts **distinct local calendar days** with positive clipped overlap per session (midnight splits use the same clipper as Today).
- **Not** install age; **not** “last 7 days from now”; **not** classification- or Lost-Hours-dependent; **not** reset on restart (derived from SQLite).
- **Empty-day policy:** baseline uses observed evidence only (aligned with D4.3 daily aggregation — no fabricated zero days).
- **First receipt gate (MVP):** `isFirstTimeReceiptEligible` === baseline `READY`.
- Does **not** gate tracking or raw History queries — gates **first meaningful Time Receipt** eligibility only.
- **MVP performance:** full-table chronological read is acceptable at current device-scale volume; optimize later if needed (e.g. distinct-day index) without changing semantics.

## Pace projection

- **Domain:** `computePaceProjection` — integer ms arithmetic from observed Lost ms and observed calendar day count.
- UI supplies copy (“30-day equivalent”); domain does not embed marketing or prediction language.
- **Not** implemented in native Android; **not** calculated in React components.

## Boundaries (unchanged from Day 3)

- No UI → SQLite or UsageStatsManager.
- No classification policy in SQLite session repository.
- No URL/browser/title inference; no AccessibilityService; no AI/cloud for analytics.
- Report **notification frequency** is orthogonal to analytics computation (documented in product doc only).

## Day 4 delivery scope

D4.1–D4.6 cover historical read models through Day Detail. Time Receipt UI, notifications, and background jobs are later phases.

## Related docs

- [Today dashboard](./today-dashboard.md)
- [Classification](./classification.md)
- [FB-001 product semantics](../product/behavioral-insights-and-time-receipt.md)
- ADR [0007](../decisions/0007-historical-classification-current-effective.md)
