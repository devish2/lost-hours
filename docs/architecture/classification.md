# Classification architecture

Classification assigns **value judgments** to activity described by tracking facts. It lives entirely in **domain** (`apps/mobile/src/domain/classification`).

## Core types

| Type | Role |
|------|------|
| `ClassificationContext` | Input: platform, content type, app identity, etc. |
| `ClassificationRule` | Policy row: matchers, target classification, source, priority |
| `ClassificationResult` | Output: classification, source, optional matched rule id |

Engine: **`RuleBasedActivityClassifier`**.

## Rule resolution order

When multiple rules match a context, the winning rule is chosen by **`compareClassificationRules`**:

1. **Classification source** (higher precedence wins):
   - USER_OVERRIDE
   - USER_RULE
   - SYSTEM_DEFAULT
   - INFERRED
   - UNKNOWN
2. **Higher `priority` number** wins among same source.
3. **Greater matcher specificity** wins (more dimensions set on the rule).
4. **Ascending lexical rule id** — smaller id wins final ties.

## Matchers and specificity

A rule may specify any combination of:

- `packageName`
- `platform`
- `contentType`

**All defined matchers on a rule must match** the context.

Specificity score = count of defined matcher fields (0–3).

Rules with **no matchers** (specificity 0) **never match**, even if enabled.

Disabled rules are ignored.

## No matching rule

If no rule matches:

- Classification: **UNKNOWN**
- Source: **UNKNOWN**

## App-level user rules (D3.4)

Users classify **Android packages**, not display names or Platform labels.

| Concept | Contract |
|---------|----------|
| Identity key | `packageName` (e.g. `com.snapchat.android`) |
| Source | `USER_RULE` |
| Rule id | `user-app:<packageName>` (stable; reclassify upserts same row) |
| Matchers | `packageName` only — no `platform`, `contentType`, or `displayName` |
| Priority | Fixed `APP_USER_CLASSIFICATION_RULE_PRIORITY` (0); users choose classification only |
| Explicit values | `PRODUCTIVE`, `NEUTRAL`, `LEISURE`, `WASTE` |
| UNKNOWN / clear | **Remove** the app-level `USER_RULE` — do not persist `USER_RULE → UNKNOWN` |
| Tracking facts | Rule changes do **not** rewrite `usage_sessions` |

Application API: `AppUserClassification` (`getClassification`, `setClassification`, `clearClassification`, `listAppUserRules`).

**Persistence (D3.5):** `getAppUserClassification()` → memoized `getAppStorage()` → `SQLiteClassificationRuleRepository` → `classification_rules`. Same DB lifecycle as sessions; upsert by stable rule id; `clearClassification` deletes the row.

## Effective classification at read time (D3.6)

```
UsageSession (persisted facts, often UNKNOWN at sync)
        +
enabled ClassificationRule[] (findEnabled)
        ↓
applyEffectiveClassificationToUsageSessions + RuleBasedActivityClassifier
        ↓
analytics copies (classification / classificationSource overridden)
        ↓
GetTodayDashboard → aggregators → Lost Time (WASTE only)
```

- **Raw / persisted `UsageSession`** rows keep sync-time `classification` / `classificationSource` (typically **UNKNOWN**). User reclassification updates **`classification_rules` only**, not `usage_sessions` (D3.7).
- **Effective / analytics copies** from `applyEffectiveClassificationToUsageSessions` carry resolved classification for `GetTodayDashboard` only — **never** written back to SQLite.
- Reclassification takes effect on the next Today refresh without rewriting tracking facts.
- Rule load failure → `TodayDashboardRefreshError` (`QUERY_FAILED`); classifier failure → `ANALYTICS_FAILED` (not silent UNKNOWN).
- App labels (`displayName`) and Platform enum do not drive rule matching; package rules match on `packageName` only.
- UNKNOWN effective classification counts toward tracked/unknown totals, **not** Lost Hours (Lost Time V1 = sum of effective **WASTE** duration only; see [0004-lost-time-waste-only.md](../decisions/0004-lost-time-waste-only.md)).
- Browser/site identity from Chrome remains unavailable (UsageStats); no URL inspection.

Listing user app rules returns enabled package-only `USER_RULE` rows sorted by `packageName` ascending (excludes `SYSTEM_DEFAULT`, `INFERRED`, `USER_OVERRIDE` unless they match the app-rule shape, which they should not).

## Policy-agnostic engine

The engine does **not** embed product policy such as “Instagram = WASTE” or “LinkedIn = PRODUCTIVE”. Rules come from configuration/storage (SQLite `classification_rules` when populated).

Demo dashboard sessions carry explicit classifications in fixture data only; they do not imply default rules.

## Today editing (D3.10)

The Today app row classification control calls **`AppUserClassification`** through `TodayLiveDashboardService` / `TodayAppClassificationActions`. It persists only explicit **PRODUCTIVE / NEUTRAL / LEISURE / WASTE** app-level `USER_RULE` rows keyed by `packageName`, then runs the normal Today refresh (effective classification + analytics). **Clear** deletes the app rule; effective state afterward is whatever the classifier returns. **`usage_sessions` are not updated.** Chooser “Clear classification” uses **`getExplicitAppClassification`** (repository truth), not effective row `classificationSource` alone.

## Boundaries

- **Tracking** does not classify.
- **Platform identity** (package → Platform enum) is separate from classification; see [platform-identity.md](./platform-identity.md).
- **Storage** stores rules and session classifications; it does not run the classifier.
- **UI** displays classifications produced upstream; it does not re-implement rule logic.

See unit tests: `RuleBasedActivityClassifier.test.ts`.
