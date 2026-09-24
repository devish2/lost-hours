import { LOST_HOURS_USAGE_TRACKING_MODULE_NAME } from './getNativeUsageTrackingModule';

describe('getNativeUsageTrackingModule', () => {
  it('uses the Android registered module name', () => {
    expect(LOST_HOURS_USAGE_TRACKING_MODULE_NAME).toBe('LostHoursUsageTracking');
  });
});
