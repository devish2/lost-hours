import type { UsageSession } from '../../domain/session/UsageSession';

/**
 * Analytics-time copy produced by {@link applyEffectiveClassificationToUsageSessions}.
 * Carries effective classification/source; must not be written to `usage_sessions`.
 *
 * Persisted/raw sessions retain sync-time classification (typically UNKNOWN).
 */
export type EffectiveUsageSessionForAnalytics = UsageSession;
