package com.aevora.losthours.tracking.usagestats

/** Validates half-open query bounds in epoch milliseconds: **[fromTimestamp, toTimestamp)**. */
object UsageStatsTimeRangeValidator {
  fun validate(fromTimestamp: Long, toTimestamp: Long) {
    if (fromTimestamp < 0L || toTimestamp < 0L) {
      throw UsageStatsCollectionException.InvalidTimeRange(
        "Timestamps must be non-negative: from=$fromTimestamp, to=$toTimestamp",
      )
    }
    if (fromTimestamp >= toTimestamp) {
      throw UsageStatsCollectionException.InvalidTimeRange(
        "Invalid usage event time range: [$fromTimestamp, $toTimestamp) requires fromTimestamp < toTimestamp",
      )
    }
  }
}
