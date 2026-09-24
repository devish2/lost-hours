package com.aevora.losthours.tracking.usagestats

/** Pure filtering and ordering rules for collected usage events. */
object CollectedUsageEventPolicies {
  fun isValidPackageName(packageName: String?): Boolean {
    return !packageName.isNullOrBlank()
  }

  fun isWithinHalfOpenRange(timestamp: Long, fromTimestamp: Long, toTimestamp: Long): Boolean {
    return timestamp >= fromTimestamp && timestamp < toTimestamp
  }

  /**
   * Stable ordering: timestamp ascending, then package name, then event type.
   */
  fun sortDeterministic(events: List<CollectedUsageEvent>): List<CollectedUsageEvent> {
    return events.sortedWith(
      compareBy(CollectedUsageEvent::timestamp)
        .thenBy(CollectedUsageEvent::packageName)
        .thenBy(CollectedUsageEvent::eventType),
    )
  }
}
