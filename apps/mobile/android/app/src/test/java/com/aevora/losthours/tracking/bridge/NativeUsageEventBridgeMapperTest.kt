package com.aevora.losthours.tracking.bridge

import com.aevora.losthours.tracking.usagestats.CollectedUsageEvent
import com.aevora.losthours.tracking.usagestats.NativeUsageEventType
import org.junit.Assert.assertEquals
import org.junit.Test

class NativeUsageEventBridgeMapperTest {
  @Test
  fun convertsCollectedEventToBridgeDto() {
    val dto =
      NativeUsageEventBridgeMapper.toBridgeDto(
        CollectedUsageEvent(
          packageName = "com.example.app",
          timestamp = 1_710_000_000_123L,
          eventType = NativeUsageEventType.FOREGROUND,
        ),
      )
    assertEquals("com.example.app", dto.packageName)
    assertEquals(1_710_000_000_123.0, dto.timestamp, 0.0)
    assertEquals(NativeUsageEventType.FOREGROUND, dto.eventType)
  }
}
