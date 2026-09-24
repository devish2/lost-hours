package com.aevora.losthours.tracking.bridge

import com.aevora.losthours.tracking.usageaccess.UsageAccessController
import com.aevora.losthours.tracking.usageaccess.UsageAccessPermissionStatus
import com.aevora.losthours.tracking.usagestats.UsageStatsCollectionException
import com.aevora.losthours.tracking.usagestats.UsageStatsEventCollector
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@ReactModule(name = LostHoursUsageTrackingModule.NAME)
class LostHoursUsageTrackingModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val usageAccessController = UsageAccessController(reactContext)
  private val usageStatsEventCollector = UsageStatsEventCollector(
    reactContext,
    usageAccessController,
  )
  private val backgroundExecutor: ExecutorService = Executors.newSingleThreadExecutor()

  override fun getName(): String = NAME

  @ReactMethod
  fun getPermissionStatus(promise: Promise) {
    try {
      val status = usageAccessController.getPermissionStatus()
      when (status) {
        UsageAccessPermissionStatus.GRANTED,
        UsageAccessPermissionStatus.DENIED,
        UsageAccessPermissionStatus.UNKNOWN,
        -> promise.resolve(status)
        else -> promise.resolve(UsageAccessPermissionStatus.UNKNOWN)
      }
    } catch (_: RuntimeException) {
      promise.resolve(UsageAccessPermissionStatus.UNKNOWN)
    }
  }

  @ReactMethod
  fun openUsageAccessSettings(promise: Promise) {
    reactApplicationContext.runOnUiQueueThread {
      try {
        val opened = usageAccessController.openUsageAccessSettings()
        if (opened) {
          promise.resolve(null)
        } else {
          promise.reject(
            UsageTrackingBridgeErrors.USAGE_SETTINGS_UNAVAILABLE,
            "Usage Access settings could not be opened",
          )
        }
      } catch (error: RuntimeException) {
        promise.reject(
          UsageTrackingBridgeErrors.USAGE_SETTINGS_UNAVAILABLE,
          "Usage Access settings could not be opened",
          error,
        )
      }
    }
  }

  @ReactMethod
  fun getUsageEvents(fromTimestamp: Double, toTimestamp: Double, promise: Promise) {
    backgroundExecutor.execute {
      try {
        val fromMs = fromTimestamp.toLong()
        val toMs = toTimestamp.toLong()
        val events = usageStatsEventCollector.collectEvents(fromMs, toMs)
        promise.resolve(NativeUsageEventBridgeMapper.toWritableArray(events))
      } catch (error: UsageStatsCollectionException) {
        UsageTrackingBridgeErrors.rejectFromCollectionException(promise, error)
      } catch (error: RuntimeException) {
        promise.reject(
          UsageTrackingBridgeErrors.USAGE_STATS_QUERY_FAILED,
          "Usage event collection failed",
          error,
        )
      }
    }
  }

  override fun invalidate() {
    backgroundExecutor.shutdown()
    super.invalidate()
  }

  companion object {
    const val NAME: String = "LostHoursUsageTracking"
  }
}
