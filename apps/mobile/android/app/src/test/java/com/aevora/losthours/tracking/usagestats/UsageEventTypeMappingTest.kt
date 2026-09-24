package com.aevora.losthours.tracking.usagestats

import android.app.usage.UsageEvents
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class UsageEventTypeMappingTest {
  @Test
  fun mapsForegroundAndBackgroundEvents() {
    assertEquals(
      NativeUsageEventType.FOREGROUND,
      UsageEventTypeMapping.fromAndroidUsageEventType(UsageEvents.Event.MOVE_TO_FOREGROUND),
    )
    assertEquals(
      NativeUsageEventType.BACKGROUND,
      UsageEventTypeMapping.fromAndroidUsageEventType(UsageEvents.Event.MOVE_TO_BACKGROUND),
    )
  }

  @Test
  fun filtersUnsupportedAndroidEventTypes() {
    assertNull(
      UsageEventTypeMapping.fromAndroidUsageEventType(
        UsageEvents.Event.FOREGROUND_SERVICE_START,
      ),
    )
    assertNull(UsageEventTypeMapping.fromAndroidUsageEventType(-999))
  }
}
