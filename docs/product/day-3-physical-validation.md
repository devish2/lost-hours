# Day 3 — physical Android validation (D3.12)

Signed off after D3.12 on a real device. Day 3 adds app-level classification, effective analytics, per-app Today breakdown, and PackageManager display labels.

## Device

| Field | Value |
|--------|--------|
| Model | CPH2423 |
| Android | 15 |
| API | 35 |

## Build under test

- Package: `com.aevora.losthours`
- Uncommitted D3.2–D3.12 worktree (pre–D3.13 commit), installed via `./gradlew installDebug`
- Existing Day 2 local data retained (no intentional app-data wipe)

## Real UsageStats / Today

- Today showed real Android UsageStats rows with meaningful tracked time.
- Examples during validation: Total Tracked approximately **4h45m**, later **4h53m**, and after continued real device activity approximately **5h**.
- Lost Hours examples: **0m** initially (all UNKNOWN), then **27m** / **28m** after Snapchat classified WASTE.
- Lost by platform while Snapchat was WASTE: **OTHER ~27m** (Snapchat platform OTHER).

## Human-readable app labels (D3.12 metadata fix)

After the MAIN/LAUNCHER `<queries>` visibility fix and Today refresh, common apps displayed **application labels** from PackageManager, including examples such as:

Phone, Chrome, System Launcher, Snapchat, WhatsApp, Messages, Duolingo, Settings, LinkedIn, Gmail, Photos, Files by Google, ChatGPT, Google Play Store.

Package-name fallback remains supported when Android cannot resolve a label.

## Chrome privacy

**PASS:** Chrome appeared as **application-level** usage only (e.g. Chrome / `com.android.chrome`). No website- or platform-inference rows (Instagram, Facebook, X, YouTube, Reddit, LinkedIn-in-browser) were generated from Chrome activity alone.

## Classification UI (D3.12 interaction fix)

**PASS:** Classification control opened the chooser physically (Productive / Neutral / Leisure / Waste / Clear when applicable / Cancel). Modal-outside-ScrollView fix verified on device.

## Classification lifecycle (target: Snapchat)

Physical transitions **PASS**:

| Step | Result |
|------|--------|
| Initial | UNKNOWN |
| Set WASTE | Row WASTE; Lost Hours increased |
| Set PRODUCTIVE | Row PRODUCTIVE |
| Set NEUTRAL | Row NEUTRAL |
| Set LEISURE | Row LEISURE |
| Clear | UNKNOWN |

**Observed WASTE:** Snapchat approximately **27–28m** WASTE while classified.

**Not recorded:** Exact Lost Hours value **immediately after WASTE → PRODUCTIVE** (not captured during the session; do not infer a number).

## Refresh / idempotency

Repeated Today refresh did not show an obvious multiplication pattern (e.g. 30m → 60m → 90m from refresh alone). Total Tracked increases during the session were consistent with **continued real device usage**, not refresh loops.

## Restart persistence

**PASS:** Force-stop / relaunch after clear kept Snapchat **UNKNOWN** when no explicit rule remained.

**PASS:** Classification rules persisted across restart when not cleared (Snapchat remained WASTE when rule was left in place).

## Permission revoke / re-grant

Pre-revoke: Snapchat set to **WASTE**.

**Usage Access OFF — PASS**

- Recovery UI appeared (no crash; onboarding did not incorrectly restart).
- Observed copy: *"Usage Access permission is required to load Today"* with **Open Usage Access Settings** and **Retry**.

**Usage Access ON — PASS**

- Today restored; Snapchat remained **WASTE**; historical usage remained.
- Lost Hours restored coherently (observed approximately **28m** Lost, **5h** Total Tracked after re-grant).
- No obvious usage multiplication.

**Final force-stop / relaunch — PASS:** App opened normally; Snapchat remained WASTE; analytics coherent.

## D3.12 outcome

**PASS** — ready for D3.13 closure commit.
