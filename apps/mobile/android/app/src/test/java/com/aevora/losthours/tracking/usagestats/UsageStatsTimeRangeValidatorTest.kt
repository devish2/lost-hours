package com.aevora.losthours.tracking.usagestats

import org.junit.Assert.assertThrows
import org.junit.Test

class UsageStatsTimeRangeValidatorTest {
  @Test
  fun acceptsValidHalfOpenRange() {
    UsageStatsTimeRangeValidator.validate(0L, 1L)
    UsageStatsTimeRangeValidator.validate(100L, 200L)
  }

  @Test
  fun rejectsNegativeTimestamps() {
    assertThrows(UsageStatsCollectionException.InvalidTimeRange::class.java) {
      UsageStatsTimeRangeValidator.validate(-1L, 10L)
    }
    assertThrows(UsageStatsCollectionException.InvalidTimeRange::class.java) {
      UsageStatsTimeRangeValidator.validate(0L, -1L)
    }
  }

  @Test
  fun rejectsInvalidOrEmptyRange() {
    assertThrows(UsageStatsCollectionException.InvalidTimeRange::class.java) {
      UsageStatsTimeRangeValidator.validate(10L, 10L)
    }
    assertThrows(UsageStatsCollectionException.InvalidTimeRange::class.java) {
      UsageStatsTimeRangeValidator.validate(20L, 10L)
    }
  }
}
