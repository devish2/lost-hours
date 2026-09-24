# Overlapping session analytics (Day 2)

Android UsageStats lifecycle events are processed **per package**. The Session Builder produces one session per foreground→background (or truncated) interval per app.

When the user switches between apps quickly, stored sessions for different packages may **overlap in time**. Day 2 analytics **sum** clipped session `durationMs` values into `totalTrackedMs`.

## Implication

`totalTrackedMs` is **not** guaranteed to equal unique wall-clock screen time when intervals overlap across apps (or duplicate logical coverage). This is intentional for Day 2 — no silent overlap deduplication was added.

## Future

Wall-clock or attention-based deduplication would be a separate product/analytics decision (not D2.10).
