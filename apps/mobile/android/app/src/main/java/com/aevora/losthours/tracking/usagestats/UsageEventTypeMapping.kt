package com.aevora.losthours.tracking.usagestats

import android.app.usage.UsageEvents

/**
 * Maps Android {@code UsageEvents} event types to normalized tracking strings.
 *
 * Policy: only {@code MOVE_TO_FOREGROUND} and {@code MOVE_TO_BACKGROUND} are retained. All other
 * Android usage event types are **filtered out** (not returned) because they do not map cleanly to
 * the existing FOREGROUND/BACKGROUND contract without inferring activity semantics.
 */
object UsageEventTypeMapping {
  /**
   * @return normalized type, or {@code null} if the Android event should be filtered out.
   */
  fun fromAndroidUsageEventType(androidEventType: Int): String? {
    return when (androidEventType) {
      UsageEvents.Event.MOVE_TO_FOREGROUND -> NativeUsageEventType.FOREGROUND
      UsageEvents.Event.MOVE_TO_BACKGROUND -> NativeUsageEventType.BACKGROUND
      else -> null
    }
  }
}
