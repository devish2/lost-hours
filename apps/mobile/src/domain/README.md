# Lost Hours — mobile domain

Plain TypeScript domain models for the Lost Hours product. This layer must not import React, React Native, navigation, SQLite, or Android/Kotlin APIs.

## Invariants

1. **Tracking records facts** — it does not decide productive, neutral, leisure, or waste.
2. **Platform, ContentType, and ActivityClassification are independent** — combine them explicitly; never collapse into a single enum.
3. **Social-media usage is not automatically waste** — Instagram is not inherently `WASTE`; LinkedIn is not inherently `PRODUCTIVE`.
4. **Lost Time (MVP)** — sum of valid `WASTE` session durations (see Lost Time below).
5. **`UNKNOWN` is valid** — prefer it over unsupported inference.
6. **No platform UI or native APIs** in domain types.
7. **Timestamps** — epoch milliseconds unless documented otherwise.
8. **Daily dates** — `YYYY-MM-DD` strings in the user's local calendar context (see `DailyUsageSummary`).

## Classification

Classification is **rule-driven**. Platforms and content types do not imply productivity by themselves; explicit `ClassificationRule` entries supply policy.

Resolution for a `ClassificationContext` against enabled rules:

1. **Match** — every matcher field on the rule (`platform`, `contentType`, `packageName`) must agree with the context. Disabled rules and rules with **no matchers** never match.
2. **Source precedence** (highest wins): `USER_OVERRIDE` → `USER_RULE` → `SYSTEM_DEFAULT` → `INFERRED` → `UNKNOWN`.
3. **Priority** — higher numeric `priority` wins when source is tied.
4. **Specificity** — more matcher dimensions on the rule wins when source and priority are tied (+1 each for `platform`, `contentType`, `packageName` defined on the rule).
5. **Tie-break** — ascending lexical `id` (smaller id wins). Result does not depend on rule array order.
6. **Fallback** — if nothing matches: `classification` and `source` are both `UNKNOWN`, with no `matchedRuleId`.

`RuleBasedActivityClassifier` returns a `ClassificationResult`; it does not mutate sessions or rules.

## Lost Time

**MVP rule:** Lost Time = sum of `durationMs` for sessions where `classification === WASTE`.

- Only `WASTE` contributes. `PRODUCTIVE`, `NEUTRAL`, `LEISURE`, and `UNKNOWN` classifications contribute **zero** Lost Time.
- Classification alone determines Lost Time — not `Platform` or `ContentType`.
- **Valid analytics session:** `durationMs > 0`. Sessions with `durationMs <= 0` are skipped (no throw, no mutation).
- `LostTimeSummary.sessionCount` is the count of **valid WASTE** sessions, not all input sessions.
- Breakdowns (`byPlatform`, `byContentType`) include only WASTE durations; sparse maps omit zero keys.

`DefaultLostTimeCalculator` implements this logic.

## Daily aggregation

`DefaultDailyUsageAggregator.aggregate(date, sessions)` builds a `DailyUsageSummary` for the given `YYYY-MM-DD` string.

- Callers must supply sessions **already scoped** to that local calendar day; the aggregator does not filter by timestamp or timezone.
- Valid sessions (`durationMs > 0`) add to `totalTrackedMs`, exactly one classification bucket, `sessionCount`, and `longestSessionMs`.
- `LEISURE` and `WASTE` are separate buckets. Only `wasteMs` reflects WASTE classification time; Lost Time for dashboards composes `LostTimeCalculator` separately.
- `UNKNOWN` classification still counts as tracked time (`unknownMs`, `totalTrackedMs`) but not Lost Time.
- Invalid-duration sessions are excluded; empty input yields zeros (including `longestSessionMs: 0`).

## Persistence contracts

Repository interfaces in `domain/repositories/` describe local storage using domain models only (no SQLite types).

- **Usage sessions:** `findBetween(from, to)` uses **[from, to)** on `startTime` (ms). Date-boundary selection is an application concern.
- **Daily summaries:** `findBetweenDates(fromDate, toDate)` uses **inclusive** `YYYY-MM-DD` bounds (lexicographic order).
- Implementations live under `infrastructure/storage/sqlite/`; domain code must not import them.
