import { UsageEventType } from '../../../domain/usage/UsageEventType';
import { TrackingSource } from '../../../domain/usage/TrackingSource';
import { UsageTrackingPermissionStatus } from '../UsageTrackingPermissionStatus';
import { MockUsageTrackingProvider } from './MockUsageTrackingProvider';

const event = (
  timestamp: number,
  packageName = 'com.example.app',
) => ({
  timestamp,
  app: { packageName },
  eventType: UsageEventType.FOREGROUND,
  trackingSource: TrackingSource.ANDROID_USAGE_STATS,
});

describe('MockUsageTrackingProvider', () => {
  it('returns GRANTED permission status', async () => {
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.GRANTED,
    });
    expect(await provider.getPermissionStatus()).toBe(
      UsageTrackingPermissionStatus.GRANTED,
    );
  });

  it('returns DENIED permission status', async () => {
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.DENIED,
    });
    expect(await provider.getPermissionStatus()).toBe(
      UsageTrackingPermissionStatus.DENIED,
    );
  });

  it('returns UNKNOWN permission status', async () => {
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.UNKNOWN,
    });
    expect(await provider.getPermissionStatus()).toBe(
      UsageTrackingPermissionStatus.UNKNOWN,
    );
  });

  it('returns events inside [from, to)', async () => {
    const events = [event(100), event(200), event(300)];
    const provider = new MockUsageTrackingProvider({ events });
    const result = await provider.getUsageEvents(100, 300);
    expect(result.map(e => e.timestamp)).toEqual([100, 200]);
  });

  it('includes an event exactly at fromTimestamp', async () => {
    const provider = new MockUsageTrackingProvider({ events: [event(500)] });
    const result = await provider.getUsageEvents(500, 600);
    expect(result).toHaveLength(1);
  });

  it('excludes an event exactly at toTimestamp', async () => {
    const provider = new MockUsageTrackingProvider({ events: [event(600)] });
    const result = await provider.getUsageEvents(500, 600);
    expect(result).toHaveLength(0);
  });

  it('excludes events before the range', async () => {
    const provider = new MockUsageTrackingProvider({ events: [event(50)] });
    const result = await provider.getUsageEvents(100, 200);
    expect(result).toHaveLength(0);
  });

  it('excludes events after the range', async () => {
    const provider = new MockUsageTrackingProvider({ events: [event(250)] });
    const result = await provider.getUsageEvents(100, 200);
    expect(result).toHaveLength(0);
  });

  it('returns empty results for empty event collection', async () => {
    const provider = new MockUsageTrackingProvider({ events: [] });
    expect(await provider.getUsageEvents(0, 100)).toEqual([]);
  });

  it('rejects when fromTimestamp equals toTimestamp', async () => {
    const provider = new MockUsageTrackingProvider({ events: [event(100)] });
    await expect(provider.getUsageEvents(100, 100)).rejects.toThrow(
      /Invalid usage event time range/,
    );
  });

  it('rejects when fromTimestamp is greater than toTimestamp', async () => {
    const provider = new MockUsageTrackingProvider({ events: [event(100)] });
    await expect(provider.getUsageEvents(200, 100)).rejects.toThrow(
      /Invalid usage event time range/,
    );
  });

  it('does not mutate the supplied event collection', async () => {
    const events = [event(150)];
    const snapshot = JSON.stringify(events);
    const provider = new MockUsageTrackingProvider({ events });
    await provider.getUsageEvents(100, 200);
    expect(JSON.stringify(events)).toBe(snapshot);
  });
});
