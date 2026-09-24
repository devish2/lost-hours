import { UsageTrackingPermissionStatus } from '../../infrastructure/tracking/UsageTrackingPermissionStatus';
import { UsageTrackingCompositionKind } from '../../infrastructure/tracking/UsageTrackingComposition';
import {
  canContinueFromUiPhase,
  mapPermissionStatusToUiPhase,
  uiPhaseFromCompositionKind,
} from './usagePermissionFlow';

describe('usagePermissionFlow', () => {
  it('maps domain permission statuses to UI phases', () => {
    expect(mapPermissionStatusToUiPhase(UsageTrackingPermissionStatus.GRANTED)).toBe(
      'granted',
    );
    expect(mapPermissionStatusToUiPhase(UsageTrackingPermissionStatus.DENIED)).toBe(
      'denied',
    );
    expect(mapPermissionStatusToUiPhase(UsageTrackingPermissionStatus.UNKNOWN)).toBe(
      'unknown',
    );
  });

  it('derives initial UI phase from composition kind', () => {
    expect(
      uiPhaseFromCompositionKind(UsageTrackingCompositionKind.ANDROID_NATIVE),
    ).toBe('loading');
    expect(
      uiPhaseFromCompositionKind(
        UsageTrackingCompositionKind.ANDROID_NATIVE_UNAVAILABLE,
      ),
    ).toBe('unavailable');
    expect(
      uiPhaseFromCompositionKind(UsageTrackingCompositionKind.UNSUPPORTED_PLATFORM),
    ).toBe('unsupported');
  });

  it('allows Continue only when UI phase is granted', () => {
    expect(canContinueFromUiPhase('granted')).toBe(true);
    expect(canContinueFromUiPhase('denied')).toBe(false);
    expect(canContinueFromUiPhase('unknown')).toBe(false);
    expect(canContinueFromUiPhase('error')).toBe(false);
    expect(canContinueFromUiPhase('loading')).toBe(false);
  });
});
