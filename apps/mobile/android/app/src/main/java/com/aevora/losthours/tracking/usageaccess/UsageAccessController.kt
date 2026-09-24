package com.aevora.losthours.tracking.usageaccess

import android.content.Context

/**
 * Day 2.1 entry point for Usage Access permission checks and settings navigation. Intended to be
 * wired to {@code NativeUsageTrackingModule} in D2.3; not exposed to React Native in D2.1.
 */
class UsageAccessController(context: Context) {
  private val permissionChecker = UsageAccessPermissionChecker(context)
  private val settingsNavigator = UsageAccessSettingsNavigator(context)

  fun getPermissionStatus(): String = permissionChecker.getPermissionStatus()

  fun openUsageAccessSettings(): Boolean = settingsNavigator.openUsageAccessSettings()
}
