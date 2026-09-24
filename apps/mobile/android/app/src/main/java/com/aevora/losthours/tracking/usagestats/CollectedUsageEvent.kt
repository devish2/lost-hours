package com.aevora.losthours.tracking.usagestats

/**
 * Factual app-level usage observation from Android {@code UsageStatsManager}. Not the TypeScript
 * domain {@code UsageEvent}.
 */
data class CollectedUsageEvent(
  val packageName: String,
  val timestamp: Long,
  val eventType: String,
)
