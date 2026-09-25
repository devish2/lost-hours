import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { Platform } from '../../domain/platform/Platform';
import { resolvePlatformFromAndroidPackage } from '../../domain/platform/androidPackagePlatformCatalog';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import { isValidAnalyticsSession } from '../../domain/session/isValidAnalyticsSession';
import { GetTodayDashboard } from '../queries/GetTodayDashboard';
import { aggregateTodayUsageByApp } from '../today/aggregateTodayUsageByApp';
import { AppUserClassification } from '../use-cases/AppUserClassification';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';
import { enrichUsageSessionsWithAppMetadata } from '../session/enrichUsageSessionsWithAppMetadata';
import type { AppMetadataPort } from '../../domain/usage/AppMetadataPort';
import { clipUsageSessionsToWindow } from '../../domain/session/clipUsageSessionsToWindow';
import { applyEffectiveClassificationToUsageSessions } from '../classification/applyEffectiveClassificationToUsageSessions';
import { ruleBasedActivityClassifier } from '../../domain/classification/RuleBasedActivityClassifier';
import { InvalidClassificationPackageNameError } from '../../domain/classification/normalizeClassificationPackageName';

const MIN_MS = 60 * 1000;

describe('Day 3 production hardening (D3.11)', () => {
  describe('invalid session analytics boundary', () => {
    it('excludes non-positive durations from totals and per-app aggregation', () => {
      const sessions = [
        createUsageSession({ id: 'zero', durationMs: 0 }),
        createUsageSession({ id: 'neg', durationMs: -100 }),
        createUsageSession({ id: 'ok', durationMs: MIN_MS }),
      ];
      expect(isValidAnalyticsSession(sessions[0]!)).toBe(false);
      expect(isValidAnalyticsSession(sessions[1]!)).toBe(false);
      const model = new GetTodayDashboard().execute('2026-01-01', sessions);
      expect(model.totalTrackedMs).toBe(MIN_MS);
      expect(model.totalLostMs).toBe(0);
      expect(aggregateTodayUsageByApp(sessions)).toHaveLength(1);
    });
  });

  describe('display name presentation', () => {
    it('ignores empty, whitespace-only, and trims valid labels in app rows', () => {
      const sessions = [
        createUsageSession({
          id: 'ws',
          app: { packageName: 'com.example.ws', displayName: '   ' },
          durationMs: MIN_MS,
          endTime: MIN_MS,
        }),
        createUsageSession({
          id: 'trim',
          app: { packageName: 'com.example.trim', displayName: '  Social  ' },
          durationMs: MIN_MS,
          startTime: MIN_MS,
          endTime: 2 * MIN_MS,
        }),
        createUsageSession({
          id: 'uni',
          app: { packageName: 'com.example.uni', displayName: '社交 📱' },
          durationMs: MIN_MS,
          startTime: 2 * MIN_MS,
          endTime: 3 * MIN_MS,
        }),
      ];
      const rows = aggregateTodayUsageByApp(sessions);
      const ws = rows.find(r => r.packageName === 'com.example.ws');
      expect(ws?.displayName).toBeUndefined();
      expect(rows.find(r => r.packageName === 'com.example.trim')?.displayName).toBe(
        'Social',
      );
      expect(rows.find(r => r.packageName === 'com.example.uni')?.displayName).toBe(
        '社交 📱',
      );
    });
  });

  describe('package label collision', () => {
    it('keeps separate rows and independent rules for same displayName', async () => {
      const repo = new InMemoryClassificationRuleRepository();
      const appClassification = new AppUserClassification(repo);
      const one = 'com.example.one';
      const two = 'com.example.two';
      await appClassification.setClassification(one, ActivityClassification.WASTE);
      const sessions = [
        createUsageSession({
          id: '1',
          app: { packageName: one, displayName: 'Social' },
          durationMs: MIN_MS,
          classification: ActivityClassification.WASTE,
          classificationSource: ClassificationSource.USER_RULE,
        }),
        createUsageSession({
          id: '2',
          app: { packageName: two, displayName: 'Social' },
          durationMs: 2 * MIN_MS,
          startTime: MIN_MS,
          endTime: 3 * MIN_MS,
        }),
      ];
      const rows = aggregateTodayUsageByApp(sessions);
      expect(rows).toHaveLength(2);
      expect(await appClassification.getExplicitAppClassification(two)).toBeNull();
      expect(await appClassification.getExplicitAppClassification(one)).toBe(
        ActivityClassification.WASTE,
      );
    });
  });

  describe('OTHER platform vs UNKNOWN classification', () => {
    it('does not conflate platform OTHER with classification UNKNOWN', () => {
      const session = createUsageSession({
        id: 'x',
        app: { packageName: 'com.example.unknown' },
        platform: Platform.OTHER,
        classification: ActivityClassification.PRODUCTIVE,
        classificationSource: ClassificationSource.USER_RULE,
        durationMs: MIN_MS,
      });
      expect(resolvePlatformFromAndroidPackage('com.example.unknown')).toBe(
        Platform.OTHER,
      );
      const row = aggregateTodayUsageByApp([session])[0];
      expect(row?.platform).toBe(Platform.OTHER);
      expect(row?.classification).toBe(ActivityClassification.PRODUCTIVE);
    });
  });

  describe('Chrome privacy', () => {
    it('maps Chrome package to OTHER only (no site inference catalog entry)', () => {
      expect(resolvePlatformFromAndroidPackage('com.android.chrome')).toBe(
        Platform.OTHER,
      );
      const row = aggregateTodayUsageByApp([
        createUsageSession({
          id: 'chrome',
          app: { packageName: 'com.android.chrome', displayName: 'Chrome' },
          platform: Platform.OTHER,
          durationMs: MIN_MS,
        }),
      ])[0];
      expect(row?.platform).toBe(Platform.OTHER);
      expect(row?.packageName).toBe('com.android.chrome');
    });
  });

  describe('metadata partial failure', () => {
    it('enriches available labels when one package has no label', async () => {
      const port: AppMetadataPort = {
        getAppMetadata: async () => [
          { packageName: 'com.whatsapp', displayName: 'WhatsApp' },
          { packageName: 'com.example.oldapp' },
        ],
      };
      const enriched = await enrichUsageSessionsWithAppMetadata(
        [
          createUsageSession({ id: 'wa', app: { packageName: 'com.whatsapp' } }),
          createUsageSession({
            id: 'old',
            app: { packageName: 'com.example.oldapp' },
          }),
        ],
        port,
      );
      expect(enriched[0]?.app.displayName).toBe('WhatsApp');
      expect(enriched[1]?.app.displayName).toBeUndefined();
      expect(enriched[1]?.app.packageName).toBe('com.example.oldapp');
    });
  });

  describe('rules without usage / usage without rows', () => {
    it('does not fabricate Today app rows when rule exists but no sessions', async () => {
      const repo = new InMemoryClassificationRuleRepository();
      const appClassification = new AppUserClassification(repo);
      await appClassification.setClassification(
        'com.snapchat.android',
        ActivityClassification.WASTE,
      );
      const model = new GetTodayDashboard().execute('2026-01-01', []);
      expect(model.apps).toEqual([]);
      expect(model.totalLostMs).toBe(0);
    });

    it('applies unseen-package rule once matching usage appears', async () => {
      const repo = new InMemoryClassificationRuleRepository();
      const appClassification = new AppUserClassification(repo);
      await appClassification.setClassification(
        'com.future.app',
        ActivityClassification.WASTE,
      );
      const empty = new GetTodayDashboard().execute('2026-01-01', []);
      expect(empty.apps).toHaveLength(0);
      const withUsage = new GetTodayDashboard().execute('2026-01-01', [
        createUsageSession({
          id: 'f',
          app: { packageName: 'com.future.app' },
          classification: ActivityClassification.WASTE,
          classificationSource: ClassificationSource.USER_RULE,
          durationMs: MIN_MS,
        }),
      ]);
      expect(withUsage.apps[0]?.lostDurationMs).toBe(MIN_MS);
    });
  });

  describe('deterministic app sort ties', () => {
    it('breaks equal tracked duration by packageName ascending', () => {
      const sessions = [
        createUsageSession({
          id: 'b',
          app: { packageName: 'com.b.app', displayName: 'Renamed-B' },
          durationMs: MIN_MS,
        }),
        createUsageSession({
          id: 'a',
          app: { packageName: 'com.a.app', displayName: 'Renamed-A' },
          durationMs: MIN_MS,
        }),
      ];
      const rows = aggregateTodayUsageByApp(sessions);
      expect(rows.map(r => r.packageName)).toEqual(['com.a.app', 'com.b.app']);
    });
  });

  describe('midnight clipping + per-app totals', () => {
    it('counts only in-window duration for Lost and app rows', () => {
      const dayStart = new Date(2024, 5, 16, 0, 0, 0).getTime();
      const sessionStart = dayStart - 10 * MIN_MS;
      const sessionEnd = dayStart + 20 * MIN_MS;
      const windowEnd = sessionEnd;
      const stored = [
        createUsageSession({
          id: 'midnight',
          app: { packageName: 'com.example.app' },
          startTime: sessionStart,
          endTime: sessionEnd,
          durationMs: sessionEnd - sessionStart,
          classification: ActivityClassification.UNKNOWN,
        }),
      ];
      const clipped = clipUsageSessionsToWindow(stored, dayStart, windowEnd);
      const effective = applyEffectiveClassificationToUsageSessions(
        clipped,
        [],
        ruleBasedActivityClassifier,
      );
      const wasteEffective = effective.map(session => ({
        ...session,
        classification: ActivityClassification.WASTE,
      }));
      const model = new GetTodayDashboard().execute('2024-06-15', wasteEffective);
      expect(model.totalTrackedMs).toBe(20 * MIN_MS);
      expect(model.totalLostMs).toBe(20 * MIN_MS);
      expect(model.apps[0]?.trackedDurationMs).toBe(20 * MIN_MS);
      expect(model.apps[0]?.lostDurationMs).toBe(20 * MIN_MS);
    });
  });

  describe('package name mutation validation', () => {
    it('rejects empty package names at AppUserClassification boundary', async () => {
      const appClassification = new AppUserClassification(
        new InMemoryClassificationRuleRepository(),
      );
      await expect(
        appClassification.setClassification('   ', ActivityClassification.WASTE),
      ).rejects.toThrow(InvalidClassificationPackageNameError);
    });
  });

  describe('large Today dataset', () => {
    it('aggregates 1000 sessions deterministically without input mutation', () => {
      const packages = ['com.app.alpha', 'com.app.beta', 'com.app.gamma'];
      const sessions = Array.from({ length: 1000 }, (_, index) =>
        createUsageSession({
          id: `s-${index}`,
          app: { packageName: packages[index % 3]! },
          durationMs: MIN_MS,
          classification:
            index % 5 === 0
              ? ActivityClassification.WASTE
              : ActivityClassification.UNKNOWN,
          startTime: index * MIN_MS,
          endTime: (index + 1) * MIN_MS,
        }),
      );
      const snapshot = JSON.stringify(sessions);
      const model = new GetTodayDashboard().execute('2026-01-01', sessions);
      const trackedSum = model.apps.reduce(
        (sum, row) => sum + row.trackedDurationMs,
        0,
      );
      expect(trackedSum).toBe(model.totalTrackedMs);
      expect(model.totalTrackedMs).toBe(1000 * MIN_MS);
      expect(model.apps).toHaveLength(3);
      expect(JSON.stringify(sessions)).toBe(snapshot);
    });
  });
});
