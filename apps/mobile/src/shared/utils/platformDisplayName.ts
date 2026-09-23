import { Platform } from '../../domain/platform/Platform';

const PLATFORM_LABELS: Record<Platform, string> = {
  [Platform.INSTAGRAM]: 'Instagram',
  [Platform.YOUTUBE]: 'YouTube',
  [Platform.FACEBOOK]: 'Facebook',
  [Platform.X]: 'X',
  [Platform.REDDIT]: 'Reddit',
  [Platform.LINKEDIN]: 'LinkedIn',
  [Platform.OTHER]: 'Other',
};

export function getPlatformDisplayName(platform: Platform): string {
  return PLATFORM_LABELS[platform];
}
