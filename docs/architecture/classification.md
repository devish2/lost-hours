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

## Policy-agnostic engine

The engine does **not** embed product policy such as “Instagram = WASTE” or “LinkedIn = PRODUCTIVE”. Rules come from configuration/storage (SQLite `classification_rules` when populated).

Demo dashboard sessions carry explicit classifications in fixture data only; they do not imply default rules.

## Boundaries

- **Tracking** does not classify.
- **Storage** stores rules and session classifications; it does not run the classifier.
- **UI** displays classifications produced upstream; it does not re-implement rule logic.

See unit tests: `RuleBasedActivityClassifier.test.ts`.
