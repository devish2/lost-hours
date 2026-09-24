# Day 2 — physical Android validation checklist

Execute **after** D2.10 on a real Android device with Usage Access. Do not treat Day 2 as complete until this passes.

## Setup

```bash
adb devices
adb reverse tcp:8081 tcp:8081
# Terminal 1 — repo root or apps/mobile
pnpm --filter lost-hours-mobile start
# Terminal 2
cd apps/mobile/android && ./gradlew installDebug
```

Logcat (optional):

```bash
adb logcat | grep -i -E 'losthours|ReactNativeJS|AndroidRuntime'
```

## A. First launch

1. Clear app data or fresh install.
2. Launch Lost Hours.
3. **Welcome** appears (after brief bootstrap spinner).
4. **Get Started** → **Usage Permission**.
5. **Continue** disabled while permission denied.
6. **Open Settings** → grant **Usage access** for Lost Hours.
7. Return to app → status **GRANTED**.
8. **Continue** → **Main** (tabs).

## B. Onboarding persistence

9. Force-stop app.
10. Relaunch → **Main** directly (no Welcome flash).
11. Force-stop again → still **Main**.

## C. Permission revocation

12. Revoke Usage Access in Android Settings.
13. Force-stop / relaunch.
14. **Usage Permission** screen (not Welcome).
15. Re-grant → **Continue** → **Main**.

## D. Real tracking (Today)

16. Use YouTube, Chrome, Settings, another app for a few minutes.
17. Open Lost Hours → **Today** tab.
18. Pull-to-refresh.
19. **Total Tracked** > 0 if Android returned events.
20. **Lost Time** may be **0** (UNKNOWN classification — expected).
21. No demo / “Preview data” totals.

## E. Idempotency

22. Note **Total Tracked**.
23. Pull-to-refresh immediately again.
24. Total must **not** approximately double.

## F. SQLite persistence

25. Force-stop app.
26. Relaunch → **Today** → refresh.
27. Prior usage still represented.

## G. Error / recovery

28. Revoke Usage Access while app is open.
29. Refresh Today → no crash; permission/recovery UI.

## H. Stability

30. Today → History → Settings → Today.
31. Pull-to-refresh several times.
32. No red screen / crash.

## Pass criteria

- All sections A–H behave as described.
- No duplicate session inflation on refresh.
- Onboarding + permission bootstrap match D2.9 semantics.
