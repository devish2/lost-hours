# FB-001 — Behavioral insights and Time Receipt

Early-user feedback (FB-001): Lost Hours must not aggressively judge the user from day one. The product should **observe** enough behavior to **reveal** patterns the user may not have noticed, rather than constantly narrating what they did wrong.

## Product loop

```text
Observe → Understand → Reveal → Compare → Improve
```

- **Observe:** Android UsageStats → sessions → local SQLite (tracking facts only).
- **Understand:** User rules and effective classification at analytics read time.
- **Reveal:** Historical aggregation, weekly patterns, first **Time Receipt** when baseline is ready.
- **Compare:** Pace equivalents and period-over-period views (future).
- **Improve:** User adjusts rules and behavior with evidence, not shame.

## Dashboard vs proactive reporting

| Concept | Meaning |
|---------|---------|
| **Today dashboard** | Available from day one when the user opens the app; shows elapsed local-day analytics. |
| **First major behavioral report** | **Time Receipt** — normally after enough **observed** evidence (MVP target: **7 distinct local calendar days** with usage), not merely 7 days since install. |

Baseline readiness controls **eligibility for the first meaningful Time Receipt**, not whether tracking runs or Today is shown.

## Analytics layers (do not mix)

| Level | Question | Example |
|-------|----------|---------|
| **1 — Tracking fact** | What happened? | Snapchat foreground 27 minutes. |
| **2 — Classification** | What does it mean for this user **now**? | User classifies Snapchat as WASTE (current effective rules). |
| **3 — Pattern** | What repeats across time? | Most Lost Hours this week in late evening. |
| **4 — Consequence / context** | What does observed pace imply? | At current 7-day pace, ~19h 48m **30-day equivalent** Lost. |

Presentation copy lives in UI; domain computes facts and equivalents only.

## Baseline readiness (MVP)

Derived from **real usage evidence**, not install timestamp alone.

Evidence inputs (conceptual):

- `firstObservedAt` / `lastObservedAt` (from valid session intervals)
- `observedCalendarDays` (distinct local calendar days with positive tracked overlap)
- `trackedDurationMs` (sum of valid session durations in the evidence set)

Status:

- **COLLECTING** — fewer than `targetCalendarDays` observed (default **7**, configurable in domain config).
- **READY** — at least `targetCalendarDays` observed days.

Today remains usable during COLLECTING. No notification delivery in early Day 4 phases.

**Application query (D4.4):** `GetBaselineProgress` reads **all persisted** usage sessions via `UsageSessionRepository.findAllChronological()` and runs `computeBaselineProgress`. It does **not** use install age, a rolling “last 7 calendar days” window, classification rules, or Lost Hours totals. Observed days may be **sparse** across a longer calendar span (e.g. usage on days 1, 2, 5, 9, 15, 20, 30 still yields READY at target 7). Progress survives app restart because evidence lives in SQLite. **First Time Receipt eligibility (MVP):** `isFirstTimeReceiptEligible(progress)` ⇔ `progress.status === 'READY'` (no notification, minimum Lost, or account gates yet).

## Time Receipt (future UI)

Working name: **Your Time Receipt** (internal: **Time Receipt**).

Conceptual sections:

- Period label (e.g. Sep 19 – Sep 25)
- Totals by classification (Productive, Neutral, Leisure, **Lost**, Unknown)
- Top apps contributing to Lost
- **Pace context** (not prediction): 30-day and 365-day **equivalents** of observed Lost duration

Semantic rules:

- Say **“At your current observed pace…”** / **“30-day equivalent…”** / **“365-day equivalent…”**
- Never **“You will waste X hours”** when the math is linear extrapolation of observed behavior.
- Do not equate one month to four weeks.
- No life-expectancy or “days of your life” framing in MVP.
- If a day-equivalent is ever shown, it means **24-hour-day equivalent** (`hours / 24`), labeled explicitly.

Calculation contract: see `computePaceProjection` in domain (`apps/mobile/src/domain/analytics/paceProjection.ts`).

Equivalents use `floor((observedLostDurationMs × periodDays) / observedCalendarDays)` so precision is not lost by flooring the daily average before scaling.

## History (D4.5)

The **History** tab shows **read-only**, factual analytics for the **most recent 30 local calendar dates** (including Today). It reads **persisted SQLite data only** — no UsageStats sync on refresh.

- **History window ≠ baseline evidence:** History is a bounded recent period; baseline readiness still uses **full** persisted observed days.
- **Newest-first** day list; days without usage evidence are **not** fabricated.
- Copy is **non-judgmental** (tracked / lost facts; no “bad day” framing).
- Baseline banner uses **observed days**, not install age.
- **Time Receipt** is not implemented in Day 4 read surfaces.

## Day Detail (D4.6)

From History, the user can open an **observed day** to answer: *where did my time go that day?*

- **Read-only:** day totals, classification breakdown (Productive / Neutral / Leisure / Lost / Unknown), and **per-app** rows grouped by **`packageName`**.
- **Current-effective** classification (ADR 0007); refresh re-reads SQLite — no UsageStats sync.
- **No** classification editing on Day Detail (Today remains the management surface).
- **No** guilt framing, charts, or cross-period comparisons in D4.6.
- Chrome and all apps remain **package-level**; no website or content inference.

## Report frequency (delivery intent, not analytics)

Future user-configurable **delivery** cadence (notifications out of scope for D4.1):

- Every 3 days
- **Weekly (default)**
- Every 2 weeks
- Monthly

Report **frequency** is independent of **History date-range queries**. History must be queryable without tying analytics to notification schedules.

## Content-level classification (future, honest MVP)

UsageStats does **not** provide Shorts vs podcast vs tutorial. MVP must not infer:

- Shorts / Reels
- Browser URL or tab semantics
- Screen text via AccessibilityService
- AI/ML labels

Product vision may document YouTube **content-level** classification later when evidence exists. Until then, **UNKNOWN** beats unsupported inference.

## Privacy and evidence

- Local-first; no cloud account required for baseline or historical analytics.
- Chrome stays **application-level** only.
- Classification identity remains **`packageName`**; labels are presentation.

## Related architecture

- [Historical analytics](../architecture/historical-analytics.md)
- [Classification](../architecture/classification.md)
- ADR [0007 — Historical classification (current-effective)](../decisions/0007-historical-classification-current-effective.md)
