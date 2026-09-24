package com.aevora.losthours.tracking.bridge

import com.aevora.losthours.tracking.usagestats.UsageStatsCollectionException
import org.junit.Assert.assertEquals
import org.junit.Test

class UsageTrackingBridgeErrorsTest {
  @Test
  fun mapsCollectionExceptionsToStableCodes() {
    assertEquals(
      UsageTrackingBridgeErrors.INVALID_TIME_RANGE,
      UsageTrackingBridgeErrors.mapCollectionException(
        UsageStatsCollectionException.InvalidTimeRange("bad range"),
      ).first,
    )
    assertEquals(
      UsageTrackingBridgeErrors.USAGE_PERMISSION_DENIED,
      UsageTrackingBridgeErrors.mapCollectionException(
        UsageStatsCollectionException.PermissionDenied(),
      ).first,
    )
    assertEquals(
      UsageTrackingBridgeErrors.USAGE_PERMISSION_UNKNOWN,
      UsageTrackingBridgeErrors.mapCollectionException(
        UsageStatsCollectionException.PermissionUnknown(),
      ).first,
    )
    assertEquals(
      UsageTrackingBridgeErrors.USAGE_STATS_UNAVAILABLE,
      UsageTrackingBridgeErrors.mapCollectionException(
        UsageStatsCollectionException.UsageStatsUnavailable("missing"),
      ).first,
    )
    assertEquals(
      UsageTrackingBridgeErrors.USAGE_STATS_QUERY_FAILED,
      UsageTrackingBridgeErrors.mapCollectionException(
        UsageStatsCollectionException.QueryFailed("query failed"),
      ).first,
    )
  }
}
