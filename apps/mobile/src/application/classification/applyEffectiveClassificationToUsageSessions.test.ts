import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { buildAppUserClassificationRule } from '../../domain/classification/appUserClassificationRule';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import type { ClassificationRule } from '../../domain/classification/ClassificationRule';
import { Platform } from '../../domain/platform/Platform';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import type { ActivityClassifier } from '../../domain/classification/ActivityClassifier';
import { applyEffectiveClassificationToUsageSessions } from './applyEffectiveClassificationToUsageSessions';

const SNAPCHAT = 'com.snapchat.android';
const THIRTY_MIN_MS = 30 * 60 * 1000;

describe('applyEffectiveClassificationToUsageSessions', () => {
  it('does not mutate input sessions', () => {
    const sessions = [
      createUsageSession({
        id: 's1',
        app: { packageName: SNAPCHAT },
        durationMs: THIRTY_MIN_MS,
      }),
    ];
    const snapshot = JSON.stringify(sessions);
    applyEffectiveClassificationToUsageSessions(sessions, [
      buildAppUserClassificationRule(SNAPCHAT, ActivityClassification.WASTE),
    ]);
    expect(JSON.stringify(sessions)).toBe(snapshot);
    expect(sessions[0].classification).toBe(ActivityClassification.UNKNOWN);
  });

  it('applies package USER_RULE regardless of displayName', () => {
    const rules = [
      buildAppUserClassificationRule(
        'com.linkedin.android',
        ActivityClassification.PRODUCTIVE,
      ),
    ];
    for (const displayName of ['LinkedIn Beta', undefined]) {
      const [effective] = applyEffectiveClassificationToUsageSessions(
        [
          createUsageSession({
            id: 'li',
            app: {
              packageName: 'com.linkedin.android',
              ...(displayName !== undefined ? { displayName } : {}),
            },
            platform: Platform.LINKEDIN,
          }),
        ],
        rules,
      );
      expect(effective.classification).toBe(ActivityClassification.PRODUCTIVE);
      expect(effective.classificationSource).toBe(
        ClassificationSource.USER_RULE,
      );
    }
  });

  it('matches package USER_RULE regardless of Platform on session', () => {
    const rules = [
      buildAppUserClassificationRule(SNAPCHAT, ActivityClassification.WASTE),
    ];
    for (const platform of [Platform.OTHER, Platform.LINKEDIN]) {
      const [effective] = applyEffectiveClassificationToUsageSessions(
        [
          createUsageSession({
            id: 'snap',
            app: { packageName: SNAPCHAT },
            platform,
          }),
        ],
        rules,
      );
      expect(effective.classification).toBe(ActivityClassification.WASTE);
    }
  });

  it('prefers USER_OVERRIDE over USER_RULE when both match', () => {
    const rules: ClassificationRule[] = [
      buildAppUserClassificationRule(SNAPCHAT, ActivityClassification.WASTE),
      {
        id: 'override-snap',
        packageName: SNAPCHAT,
        classification: ActivityClassification.PRODUCTIVE,
        source: ClassificationSource.USER_OVERRIDE,
        priority: 0,
        enabled: true,
      },
    ];
    const [effective] = applyEffectiveClassificationToUsageSessions(
      [
        createUsageSession({
          id: 'snap',
          app: { packageName: SNAPCHAT },
        }),
      ],
      rules,
    );
    expect(effective.classification).toBe(ActivityClassification.PRODUCTIVE);
    expect(effective.classificationSource).toBe(
      ClassificationSource.USER_OVERRIDE,
    );
  });

  it('ignores disabled rules', () => {
    const [effective] = applyEffectiveClassificationToUsageSessions(
      [
        createUsageSession({
          id: 'snap',
          app: { packageName: SNAPCHAT },
        }),
      ],
      [
        {
          ...buildAppUserClassificationRule(
            SNAPCHAT,
            ActivityClassification.WASTE,
          ),
          enabled: false,
        },
      ],
    );
    expect(effective.classification).toBe(ActivityClassification.UNKNOWN);
  });

  it('propagates unexpected classifier failures', () => {
    const throwingClassifier: ActivityClassifier = {
      classify: () => {
        throw new Error('classifier failed');
      },
    };
    expect(() =>
      applyEffectiveClassificationToUsageSessions(
        [createUsageSession({ id: 's1' })],
        [],
        throwingClassifier,
      ),
    ).toThrow(/classifier failed/);
  });
});
