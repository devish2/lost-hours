package com.aevora.losthours.tracking.usagestats

/** Recoverable failures for native usage event collection (for D2.3 bridge translation). */
sealed class UsageStatsCollectionException(message: String, cause: Throwable? = null) :
  Exception(message, cause) {
  class InvalidTimeRange(message: String) : UsageStatsCollectionException(message)

  class PermissionDenied :
    UsageStatsCollectionException("Usage Access permission is denied")

  class PermissionUnknown :
    UsageStatsCollectionException("Usage Access permission is unknown")

  class UsageStatsUnavailable(message: String) : UsageStatsCollectionException(message)

  class QueryFailed(message: String, cause: Throwable? = null) :
    UsageStatsCollectionException(message, cause)
}
