package com.aevora.losthours.tracking.bridge

import com.aevora.losthours.tracking.usagestats.CollectedUsageEvent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

/** Maps D2.2 collected events to React Native bridge payloads. */
object NativeUsageEventBridgeMapper {
  data class BridgeDto(
    val packageName: String,
    val timestamp: Double,
    val eventType: String,
  )

  fun toBridgeDto(event: CollectedUsageEvent): BridgeDto {
    return BridgeDto(
      packageName = event.packageName,
      timestamp = event.timestamp.toDouble(),
      eventType = event.eventType,
    )
  }

  fun toWritableMap(event: CollectedUsageEvent): WritableMap {
    val dto = toBridgeDto(event)
    return Arguments.createMap().apply {
      putString("packageName", dto.packageName)
      putDouble("timestamp", dto.timestamp)
      putString("eventType", dto.eventType)
    }
  }

  fun toWritableArray(events: List<CollectedUsageEvent>): WritableArray {
    val array = Arguments.createArray()
    for (event in events) {
      array.pushMap(toWritableMap(event))
    }
    return array
  }
}
