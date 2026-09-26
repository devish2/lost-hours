import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { ContentType } from '../../domain/classification/ContentType';
import { Platform } from '../../domain/platform/Platform';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { createAppUserClassification } from '../../infrastructure/storage/createAppUserClassification';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { HistoricalUsageAnalyticsError } from '../historical/HistoricalUsageAnalyticsError';
import { GetHistoricalUsageAnalyticsForRange } from './GetHistoricalUsageAnalyticsForRange';
import { GetUsageSessionsForRange } from './GetUsageSessionsForRange';

const MIN_MS = 60 * 1000;
const SNAPCHAT = 'com.snapchat.android';
const LINKEDIN = 'com.linkedin.android';
const WHATSAPP = 'com.whatsapp';
const YOUTUBE = 'com.google.android.youtube';
const CHROME = 'com.android.chrome';

function createHistoricalQuery(deps: {
  sessions: InMemoryUsageSessionRepository;
  rules?: InMemoryClassificationRuleRepository;
}) {
  const rules = deps.rules ?? new InMemoryClassificationRuleRepository();
  return new GetHistoricalUsageAnalyticsForRange({
    getUsageSessionsForRange: new GetUsageSessionsForRange(deps.sessions),
    classificationRuleRepository: rules,
  });
}

function assertReconciliation(model: {
  trackedDurationMs: number;
  productiveDurationMs: number;
  neutralDurationMs: number;
  leisureDurationMs: number;
  lostDurationMs: number;
  unknownDurationMs: number;
}) {
  expect(
    model.productiveDurationMs +
      model.neutralDurationMs +
      model.leisureDurationMs +
      model.lostDurationMs +
      model.unknownDurationMs,
  ).toBe(model.trackedDurationMs);
}

describe('GetHistoricalUsageAnalyticsForRange (D4.2)', () => {
  const FROM = 10_000;
  const TO = 20_000;
  const WIDE_FROM = 0;
  const WIDE_TO = 100_000_000;

  it('returns zero analytics for empty persisted data', async () => {
    const query = createHistoricalQuery({
      sessions: new InMemoryUsageSessionRepository(),
    });
    const result = await query.execute({ fromTimestamp: FROM, toTimestamp: TO });
    expect(result).toMatchObject({
      fromTimestamp: FROM,
      toTimestamp: TO,
      trackedDurationMs: 0,
      lostDurationMs: 0,
      effectiveSessions: [],
    });
  });

  it('includes one session fully inside the window', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'inside',
        startTime: 12_000,
        endTime: 15_000,
        durationMs: 3_000,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(result.trackedDurationMs).toBe(3_000);
    expect(result.effectiveSessions).toHaveLength(1);
  });

  it('clips session overlapping window start', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'cross-start',
        startTime: 8_000,
        endTime: 12_000,
        durationMs: 4_000,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(result.trackedDurationMs).toBe(2_000);
  });

  it('clips session overlapping window end', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'cross-end',
        startTime: 18_000,
        endTime: 25_000,
        durationMs: 7_000,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(result.trackedDurationMs).toBe(2_000);
  });

  it('clips session spanning entire window', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'span',
        startTime: 5_000,
        endTime: 25_000,
        durationMs: 20_000,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(result.trackedDurationMs).toBe(TO - FROM);
  });

  it('excludes session ending exactly at fromTimestamp', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'ends-at-from',
        startTime: 5_000,
        endTime: FROM,
        durationMs: 5_000,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(result.trackedDurationMs).toBe(0);
  });

  it('excludes session starting exactly at toTimestamp', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'starts-at-to',
        startTime: TO,
        endTime: TO + 5_000,
        durationMs: 5_000,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(result.trackedDurationMs).toBe(0);
  });

  it('includes session starting exactly at fromTimestamp', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'starts-at-from',
        startTime: FROM,
        endTime: FROM + 2_000,
        durationMs: 2_000,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(result.trackedDurationMs).toBe(2_000);
  });

  it('includes session ending exactly at toTimestamp', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'ends-at-to',
        startTime: TO - 3_000,
        endTime: TO,
        durationMs: 3_000,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(result.trackedDurationMs).toBe(3_000);
  });

  it.each([
    ['equal bounds', FROM, FROM],
    ['from after to', TO, FROM],
  ])('rejects invalid window: %s', async (_label, fromTimestamp, toTimestamp) => {
    const query = createHistoricalQuery({
      sessions: new InMemoryUsageSessionRepository(),
    });
    await expect(query.execute({ fromTimestamp, toTimestamp })).rejects.toMatchObject({
      code: 'INVALID_WINDOW',
    });
  });

  it('rejects non-finite window boundaries', async () => {
    const query = createHistoricalQuery({
      sessions: new InMemoryUsageSessionRepository(),
    });
    await expect(
      query.execute({ fromTimestamp: Number.NaN, toTimestamp: TO }),
    ).rejects.toMatchObject({ code: 'INVALID_WINDOW' });
  });

  it('ignores non-positive-duration sessions', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'zero',
        startTime: 12_000,
        endTime: 12_000,
        durationMs: 0,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(result.trackedDurationMs).toBe(0);
  });

  it('does not mutate persisted sessions', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const original = createUsageSession({
      id: 'raw',
      startTime: 12_000,
      endTime: 15_000,
      durationMs: 3_000,
      classification: ActivityClassification.UNKNOWN,
    });
    await sessions.save(original);
    const before = sessions.allSessions().map(s => ({ ...s, app: { ...s.app } }));
    await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(sessions.allSessions()).toEqual(before);
  });

  it('applies current-effective classification without rewriting stored sessions', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    const appClassification = createAppUserClassification(rules);
    await sessions.save(
      createUsageSession({
        id: 'snap-hist',
        app: { packageName: SNAPCHAT },
        platform: Platform.OTHER,
        startTime: 12_000,
        endTime: 12_000 + 60 * MIN_MS,
        durationMs: 60 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
        classificationSource: ClassificationSource.UNKNOWN,
      }),
    );
    const query = createHistoricalQuery({ sessions, rules });

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    let result = await query.execute({
      fromTimestamp: WIDE_FROM,
      toTimestamp: WIDE_TO,
    });
    expect(result.lostDurationMs).toBe(60 * MIN_MS);
    expect(sessions.allSessions()[0]?.classification).toBe(
      ActivityClassification.UNKNOWN,
    );

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    result = await query.execute({
      fromTimestamp: WIDE_FROM,
      toTimestamp: WIDE_TO,
    });
    expect(result.lostDurationMs).toBe(0);
    expect(result.productiveDurationMs).toBe(60 * MIN_MS);

    await appClassification.clearClassification(SNAPCHAT);
    result = await query.execute({
      fromTimestamp: WIDE_FROM,
      toTimestamp: WIDE_TO,
    });
    expect(result.lostDurationMs).toBe(0);
    expect(result.unknownDurationMs).toBe(60 * MIN_MS);
  });

  it('reconciles canonical mixed 130-minute dataset', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    const appClassification = createAppUserClassification(rules);
    const base = 12_000;
    await sessions.saveMany([
      createUsageSession({
        id: 'snap',
        app: { packageName: SNAPCHAT },
        platform: Platform.OTHER,
        startTime: base,
        endTime: base + 30 * MIN_MS,
        durationMs: 30 * MIN_MS,
      }),
      createUsageSession({
        id: 'li',
        app: { packageName: LINKEDIN },
        platform: Platform.LINKEDIN,
        startTime: base,
        endTime: base + 20 * MIN_MS,
        durationMs: 20 * MIN_MS,
      }),
      createUsageSession({
        id: 'wa',
        app: { packageName: WHATSAPP },
        platform: Platform.OTHER,
        startTime: base,
        endTime: base + 15 * MIN_MS,
        durationMs: 15 * MIN_MS,
      }),
      createUsageSession({
        id: 'yt',
        app: { packageName: YOUTUBE },
        platform: Platform.YOUTUBE,
        startTime: base,
        endTime: base + 25 * MIN_MS,
        durationMs: 25 * MIN_MS,
      }),
      createUsageSession({
        id: 'chrome',
        app: { packageName: CHROME, displayName: 'Chrome' },
        platform: Platform.OTHER,
        contentType: ContentType.OTHER,
        startTime: base,
        endTime: base + 40 * MIN_MS,
        durationMs: 40 * MIN_MS,
      }),
    ]);
    await appClassification.setClassification(SNAPCHAT, ActivityClassification.WASTE);
    await appClassification.setClassification(
      LINKEDIN,
      ActivityClassification.PRODUCTIVE,
    );
    await appClassification.setClassification(WHATSAPP, ActivityClassification.NEUTRAL);
    await appClassification.setClassification(YOUTUBE, ActivityClassification.LEISURE);

    const result = await createHistoricalQuery({ sessions, rules }).execute({
      fromTimestamp: WIDE_FROM,
      toTimestamp: WIDE_TO,
    });

    expect(result.trackedDurationMs).toBe(130 * MIN_MS);
    expect(result.lostDurationMs).toBe(30 * MIN_MS);
    expect(result.productiveDurationMs).toBe(20 * MIN_MS);
    expect(result.neutralDurationMs).toBe(15 * MIN_MS);
    expect(result.leisureDurationMs).toBe(25 * MIN_MS);
    expect(result.unknownDurationMs).toBe(40 * MIN_MS);
    assertReconciliation(result);
  });

  it('tracks duplicate display names separately by packageName', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.saveMany([
      createUsageSession({
        id: 'a',
        app: { packageName: 'com.one.app', displayName: 'Messages' },
        startTime: 12_000,
        endTime: 13_000,
        durationMs: 1_000,
      }),
      createUsageSession({
        id: 'b',
        app: { packageName: 'com.two.app', displayName: 'Messages' },
        startTime: 12_000,
        endTime: 14_000,
        durationMs: 2_000,
      }),
    ]);
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(result.trackedDurationMs).toBe(3_000);
    expect(result.effectiveSessions.map(s => s.app.packageName).sort()).toEqual([
      'com.one.app',
      'com.two.app',
    ]);
  });

  it('preserves USER_OVERRIDE over USER_RULE for the same package', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    await sessions.save(
      createUsageSession({
        id: 'snap',
        app: { packageName: SNAPCHAT },
        startTime: 12_000,
        endTime: 12_000 + 5 * MIN_MS,
        durationMs: 5 * MIN_MS,
      }),
    );
    await rules.saveMany([
      {
        id: 'rule-waste',
        packageName: SNAPCHAT,
        classification: ActivityClassification.WASTE,
        source: ClassificationSource.USER_RULE,
        priority: 100,
        enabled: true,
      },
      {
        id: 'override-productive',
        packageName: SNAPCHAT,
        classification: ActivityClassification.PRODUCTIVE,
        source: ClassificationSource.USER_OVERRIDE,
        priority: 1,
        enabled: true,
      },
    ]);
    const result = await createHistoricalQuery({ sessions, rules }).execute({
      fromTimestamp: WIDE_FROM,
      toTimestamp: WIDE_TO,
    });
    expect(result.lostDurationMs).toBe(0);
    expect(result.productiveDurationMs).toBe(5 * MIN_MS);
  });

  it('keeps OTHER platform independent from UNKNOWN classification', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'other-unknown',
        app: { packageName: SNAPCHAT },
        platform: Platform.OTHER,
        classification: ActivityClassification.UNKNOWN,
        startTime: 12_000,
        endTime: 12_000 + MIN_MS,
        durationMs: MIN_MS,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: WIDE_FROM,
      toTimestamp: WIDE_TO,
    });
    expect(result.effectiveSessions[0]?.platform).toBe(Platform.OTHER);
    expect(result.unknownDurationMs).toBe(MIN_MS);
  });

  it('tracks Chrome at package level only', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'chrome',
        app: { packageName: CHROME, displayName: 'Chrome' },
        platform: Platform.OTHER,
        startTime: 12_000,
        endTime: 12_000 + 10 * MIN_MS,
        durationMs: 10 * MIN_MS,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: WIDE_FROM,
      toTimestamp: WIDE_TO,
    });
    expect(result.effectiveSessions).toHaveLength(1);
    expect(result.effectiveSessions[0]?.app.packageName).toBe(CHROME);
    expect(
      result.effectiveSessions.some(s => s.app.packageName.includes('instagram')),
    ).toBe(false);
  });

  it('clips midnight-crossing usage to a sub-hour historical window', async () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 20, 12, 0, 0).getTime(),
    );
    const nextDay = getNextLocalCalendarDayStart(dayStart);
    const windowFrom = nextDay - 30 * MIN_MS;
    const windowTo = nextDay + 30 * MIN_MS;
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'midnight',
        startTime: nextDay - 15 * MIN_MS,
        endTime: nextDay + 15 * MIN_MS,
        durationMs: 30 * MIN_MS,
      }),
    );
    const result = await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: windowFrom,
      toTimestamp: windowTo,
    });
    expect(result.trackedDurationMs).toBe(30 * MIN_MS);
  });

  it('maps SESSION_QUERY_FAILED when repository read fails', async () => {
    const failingRepo = {
      findOverlapping: jest.fn(async () => {
        throw new Error('db locked');
      }),
    };
    const query = new GetHistoricalUsageAnalyticsForRange({
      getUsageSessionsForRange: new GetUsageSessionsForRange(
        failingRepo as never,
      ),
      classificationRuleRepository: new InMemoryClassificationRuleRepository(),
    });
    await expect(
      query.execute({ fromTimestamp: FROM, toTimestamp: TO }),
    ).rejects.toMatchObject({ code: 'SESSION_QUERY_FAILED' });
  });

  it('maps RULE_QUERY_FAILED when rule load fails', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 's',
        startTime: 12_000,
        endTime: 13_000,
        durationMs: 1_000,
      }),
    );
    const rules = {
      findEnabled: jest.fn(async () => {
        throw new Error('rules unavailable');
      }),
    };
    const query = new GetHistoricalUsageAnalyticsForRange({
      getUsageSessionsForRange: new GetUsageSessionsForRange(sessions),
      classificationRuleRepository: rules as never,
    });
    await expect(
      query.execute({ fromTimestamp: FROM, toTimestamp: TO }),
    ).rejects.toBeInstanceOf(HistoricalUsageAnalyticsError);
    await expect(
      query.execute({ fromTimestamp: FROM, toTimestamp: TO }),
    ).rejects.toMatchObject({ code: 'RULE_QUERY_FAILED' });
  });

  it('does not mutate input session objects returned from repository', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const session = createUsageSession({
      id: 'mutable',
      startTime: 12_000,
      endTime: 15_000,
      durationMs: 3_000,
    });
    await sessions.save(session);
    const snapshot = JSON.stringify(session);
    await createHistoricalQuery({ sessions }).execute({
      fromTimestamp: FROM,
      toTimestamp: TO,
    });
    expect(JSON.stringify(session)).toBe(snapshot);
  });
});
