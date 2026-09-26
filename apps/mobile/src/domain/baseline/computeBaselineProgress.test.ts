import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { createUsageSession } from '../testSupport/createUsageSession';
import { computeBaselineProgress } from './computeBaselineProgress';

describe('computeBaselineProgress', () => {
  it('returns COLLECTING with zero evidence when there are no sessions', () => {
    const progress = computeBaselineProgress([]);
    expect(progress).toEqual({
      status: 'COLLECTING',
      observedCalendarDays: 0,
      targetCalendarDays: 7,
      trackedDurationMs: 0,
      firstObservedAt: undefined,
      lastObservedAt: undefined,
    });
  });

  it('counts one observed day from a single valid session', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 10, 14, 0, 0).getTime(),
    );
    const progress = computeBaselineProgress([
      createUsageSession({
        id: 'one',
        startTime: dayStart + 3_600_000,
        endTime: dayStart + 7_200_000,
        durationMs: 3_600_000,
      }),
    ]);
    expect(progress.observedCalendarDays).toBe(1);
    expect(progress.status).toBe('COLLECTING');
    expect(progress.trackedDurationMs).toBe(3_600_000);
    expect(progress.firstObservedAt).toBe(dayStart + 3_600_000);
    expect(progress.lastObservedAt).toBe(dayStart + 7_200_000);
  });

  it('counts multiple sessions on the same local day as one observed day', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 11, 8, 0, 0).getTime(),
    );
    const progress = computeBaselineProgress([
      createUsageSession({
        id: 'a',
        startTime: dayStart + 1_000,
        endTime: dayStart + 2_000,
        durationMs: 1_000,
      }),
      createUsageSession({
        id: 'b',
        startTime: dayStart + 10_000,
        endTime: dayStart + 20_000,
        durationMs: 10_000,
      }),
    ]);
    expect(progress.observedCalendarDays).toBe(1);
    expect(progress.trackedDurationMs).toBe(11_000);
  });

  it('becomes READY after seven distinct observed local calendar days', () => {
    let dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 1, 0, 0, 0).getTime(),
    );
    const sessions = Array.from({ length: 7 }, (_, index) => {
      const session = createUsageSession({
        id: `d${index}`,
        startTime: dayStart + 60_000,
        endTime: dayStart + 120_000,
        durationMs: 60_000,
      });
      dayStart = getNextLocalCalendarDayStart(dayStart);
      return session;
    });
    const progress = computeBaselineProgress(sessions);
    expect(progress.observedCalendarDays).toBe(7);
    expect(progress.status).toBe('READY');
  });

  it('stays COLLECTING when fewer than target observed days', () => {
    let dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 1, 0, 0, 0).getTime(),
    );
    const sessions = [0, 1, 2].map(index => {
      const session = createUsageSession({
        id: `d${index}`,
        startTime: dayStart + 1_000,
        endTime: dayStart + 5_000,
        durationMs: 4_000,
      });
      dayStart = getNextLocalCalendarDayStart(dayStart);
      return session;
    });
    expect(computeBaselineProgress(sessions).status).toBe('COLLECTING');
  });

  it('ignores invalid non-positive durations', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 12, 12, 0, 0).getTime(),
    );
    const progress = computeBaselineProgress([
      createUsageSession({
        id: 'zero',
        startTime: dayStart,
        endTime: dayStart,
        durationMs: 0,
      }),
      createUsageSession({
        id: 'valid',
        startTime: dayStart + 1_000,
        endTime: dayStart + 2_000,
        durationMs: 1_000,
      }),
    ]);
    expect(progress.observedCalendarDays).toBe(1);
    expect(progress.trackedDurationMs).toBe(1_000);
  });

  it('counts both local days when a session crosses midnight', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 14, 0, 0, 0).getTime(),
    );
    const nextDayStart = getNextLocalCalendarDayStart(dayStart);
    const progress = computeBaselineProgress([
      createUsageSession({
        id: 'cross',
        startTime: nextDayStart - 3_600_000,
        endTime: nextDayStart + 3_600_000,
        durationMs: 7_200_000,
      }),
    ]);
    expect(progress.observedCalendarDays).toBe(2);
  });

  it('is independent of input session order', () => {
    const anchor = getLocalCalendarDayStart(
      new Date(2026, 7, 20, 0, 0, 0).getTime(),
    );
    const a = createUsageSession({
      id: 'a',
      startTime: anchor + 1_000,
      endTime: anchor + 2_000,
      durationMs: 1_000,
    });
    const secondDay = getNextLocalCalendarDayStart(anchor);
    const b = createUsageSession({
      id: 'b',
      startTime: secondDay + 1_000,
      endTime: secondDay + 2_000,
      durationMs: 1_000,
    });
    expect(computeBaselineProgress([a, b])).toEqual(
      computeBaselineProgress([b, a]),
    );
  });

  it('respects configurable target calendar days', () => {
    let dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 1, 0, 0, 0).getTime(),
    );
    const sessions = [0, 1, 2].map(index => {
      const session = createUsageSession({
        id: `d${index}`,
        startTime: dayStart + 1_000,
        endTime: dayStart + 2_000,
        durationMs: 1_000,
      });
      dayStart = getNextLocalCalendarDayStart(dayStart);
      return session;
    });
    expect(
      computeBaselineProgress(sessions, { targetCalendarDays: 3 }).status,
    ).toBe('READY');
    expect(
      computeBaselineProgress(sessions, { targetCalendarDays: 4 }).status,
    ).toBe('COLLECTING');
  });
});
