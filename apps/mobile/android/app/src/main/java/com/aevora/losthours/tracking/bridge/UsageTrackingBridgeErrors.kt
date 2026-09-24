package com.aevora.losthours.tracking.bridge

import com.aevora.losthours.tracking.usagestats.UsageStatsCollectionException
import com.facebook.react.bridge.Promise

object UsageTrackingBridgeErrors {
  const val USAGE_PERMISSION_DENIED: String = "USAGE_PERMISSION_DENIED"
  const val USAGE_PERMISSION_UNKNOWN: String = "USAGE_PERMISSION_UNKNOWN"
  const val USAGE_STATS_UNAVAILABLE: String = "USAGE_STATS_UNAVAILABLE"
  const val INVALID_TIME_RANGE: String = "INVALID_TIME_RANGE"
  const val USAGE_STATS_QUERY_FAILED: String = "USAGE_STATS_QUERY_FAILED"
  const val USAGE_SETTINGS_UNAVAILABLE: String = "USAGE_SETTINGS_UNAVAILABLE"
  const val NATIVE_PERMISSION_CHECK_FAILED: String = "NATIVE_PERMISSION_CHECK_FAILED"

  fun rejectFromCollectionException(
    promise: Promise,
    error: UsageStatsCollectionException,
  ) {
    val (code, message) = mapCollectionException(error)
    promise.reject(code, message, error)
  }

  fun mapCollectionException(error: UsageStatsCollectionException): Pair<String, String> {
    return when (error) {
      is UsageStatsCollectionException.InvalidTimeRange ->
        INVALID_TIME_RANGE to error.message.orEmpty()
      is UsageStatsCollectionException.PermissionDenied ->
        USAGE_PERMISSION_DENIED to "Usage Access permission is denied"
      is UsageStatsCollectionException.PermissionUnknown ->
        USAGE_PERMISSION_UNKNOWN to "Usage Access permission is unknown"
      is UsageStatsCollectionException.UsageStatsUnavailable ->
        USAGE_STATS_UNAVAILABLE to error.message.orEmpty()
      is UsageStatsCollectionException.QueryFailed ->
        USAGE_STATS_QUERY_FAILED to error.message.orEmpty()
    }
  }
}
