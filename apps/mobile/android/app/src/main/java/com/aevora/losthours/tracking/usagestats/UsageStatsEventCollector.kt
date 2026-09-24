package com.aevora.losthours.tracking.usagestats

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import com.aevora.losthours.tracking.usageaccess.UsageAccessController
import com.aevora.losthours.tracking.usageaccess.UsageAccessPermissionStatus

/**
 * Collects factual app-level usage events from {@code UsageStatsManager} for
 * **[fromTimestamp, toTimestamp)**. Requires Usage Access {@code GRANTED} via
 * {@link UsageAccessController}.
 */
class UsageStatsEventCollector(
  private val context: Context,
  private val usageAccessController: UsageAccessController,
) {
  fun collectEvents(fromTimestamp: Long, toTimestamp: Long): List<CollectedUsageEvent> {
    UsageStatsTimeRangeValidator.validate(fromTimestamp, toTimestamp)
    ensureUsageAccessGranted()

    val usageStatsManager =
      context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        ?: throw UsageStatsCollectionException.UsageStatsUnavailable(
          "UsageStatsManager is not available",
        )

    val rawEvents = queryRawEvents(usageStatsManager, fromTimestamp, toTimestamp)
    val filtered =
      rawEvents.filter { event ->
        CollectedUsageEventPolicies.isWithinHalfOpenRange(
          event.timestamp,
          fromTimestamp,
          toTimestamp,
        )
      }
    return CollectedUsageEventPolicies.sortDeterministic(filtered)
  }

  private fun ensureUsageAccessGranted() {
    when (usageAccessController.getPermissionStatus()) {
      UsageAccessPermissionStatus.GRANTED -> Unit
      UsageAccessPermissionStatus.DENIED -> throw UsageStatsCollectionException.PermissionDenied()
      UsageAccessPermissionStatus.UNKNOWN -> throw UsageStatsCollectionException.PermissionUnknown()
      else -> throw UsageStatsCollectionException.PermissionUnknown()
    }
  }

  private fun queryRawEvents(
    usageStatsManager: UsageStatsManager,
    fromTimestamp: Long,
    toTimestamp: Long,
  ): List<CollectedUsageEvent> {
    val collected = mutableListOf<CollectedUsageEvent>()
    try {
      val usageEvents: UsageEvents =
        usageStatsManager.queryEvents(fromTimestamp, toTimestamp)
          ?: return emptyList()

      val event = UsageEvents.Event()
      while (usageEvents.hasNextEvent()) {
        usageEvents.getNextEvent(event)
        val packageName = event.packageName
        if (!CollectedUsageEventPolicies.isValidPackageName(packageName)) {
          continue
        }
        val normalizedType = UsageEventTypeMapping.fromAndroidUsageEventType(event.eventType)
          ?: continue
        val timestamp = event.timeStamp
        if (!CollectedUsageEventPolicies.isWithinHalfOpenRange(
            timestamp,
            fromTimestamp,
            toTimestamp,
          )
        ) {
          continue
        }
        collected.add(
          CollectedUsageEvent(
            packageName = packageName,
            timestamp = timestamp,
            eventType = normalizedType,
          ),
        )
      }
    } catch (security: SecurityException) {
      throw UsageStatsCollectionException.QueryFailed(
        "UsageStatsManager query failed: permission or security error",
        security,
      )
    } catch (runtime: RuntimeException) {
      throw UsageStatsCollectionException.QueryFailed(
        "UsageStatsManager query failed",
        runtime,
      )
    }
    return collected
  }
}
