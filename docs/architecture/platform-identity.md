# Platform identity vs package identity (D3.2 + D3.3)

## Package name (primary)

`packageName` is the Android application identity from UsageStats (e.g. `com.linkedin.android`). It is preserved end-to-end:

```
Native event → UsageEvent → UsageSession → SQLite
```

User classification rules in Day 3+ target **`packageName`**, not Platform alone and **never** `displayName`.

## Display name (optional metadata)

`displayName` is a human-readable label from Android `PackageManager` (e.g. `com.whatsapp` → `WhatsApp`). It is **not** an identifier.

- Resolved in batch via native `getAppMetadata(packageNames)` for packages already observed in a sync window.
- Stored in SQLite `app_display_name` when enrichment succeeds before persist.
- Labels are **local-only** (no upload, no installed-app inventory, no app-content inspection, no icons).
- Lookup failure does **not** stop usage tracking; sessions persist with `packageName` only.
- UI may fall back visually to `packageName` when `displayName` is absent.

Never use `displayName` to infer Platform, merge apps, or key classification rules.

## Platform (optional grouping)

`Platform` is a Lost Hours semantic label for **known** social/video apps. It is **not** a productivity judgment.

Exact catalog (`androidPackagePlatformCatalog.ts`):

| Android package | Platform |
|-----------------|----------|
| `com.instagram.android` | INSTAGRAM |
| `com.google.android.youtube` | YOUTUBE |
| `com.facebook.katana` | FACEBOOK |
| `com.twitter.android` | X |
| `com.reddit.frontpage` | REDDIT |
| `com.linkedin.android` | LINKEDIN |
| *(anything else)* | **OTHER** |

Resolution is **exact lookup only** — no `includes`, prefixes, regex, or display-name matching.

## OTHER is valid

WhatsApp, Snapchat, Chrome, Spotify, etc. remain **OTHER** until a product-level Platform enum is explicitly approved. They are still tracked, stored, and classifiable by package rules.

## Classification (separate judgment)

`ActivityClassification` is user/product judgment (Day 3+ rules). It is independent of `displayName` and is not set by Platform or PackageManager labels.

## Not classification (platform)

`Platform` does **not** set `ActivityClassification`. LinkedIn → LINKEDIN does not imply PRODUCTIVE; Instagram → INSTAGRAM does not imply WASTE.

## Browser boundary

`com.android.chrome` → **OTHER**. Foreground Chrome time is one app session. UsageStats does **not** identify which site is open; Lost Hours must not split Chrome time into Instagram/Facebook/X without future browser-level evidence.

## Android package visibility (D3.3)

Label lookup uses `PackageManager` only for requested package names from tracking. **`QUERY_ALL_PACKAGES` is not used.** No broad `<queries>` manifest expansion in D3.3; some observed packages may not resolve a label on Android 11+ until visibility allows it. That is acceptable: tracking remains factual on `packageName`.

## Layering

- **Domain:** `PackageNamePlatformResolver` / catalog; `AppMetadataPort` contract (no Android APIs)
- **Session builder:** injects `PlatformResolver`; preserves incoming `app` identity
- **Sync:** `enrichUsageSessionsWithAppMetadata` after collect, before persist (batched, deduped)
- **Infrastructure:** `AndroidAppMetadataProvider` → `LostHoursUsageTracking.getAppMetadata`
- **Storage / UI:** no metadata or platform inference logic

See also [classification.md](./classification.md).
