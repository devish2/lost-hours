package com.aevora.losthours.tracking.usageaccess

import android.app.AppOpsManager
import android.content.Context
import android.os.Build
import android.os.Process

/**
 * Determines whether this app has Android Usage Access via {@code AppOpsManager} and
 * {@code OPSTR_GET_USAGE_STATS}. Does not query {@code UsageStatsManager}.
 */
class UsageAccessPermissionChecker(private val context: Context) {
  fun getPermissionStatus(): String {
    return try {
      val appOps =
        context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager
          ?: return UsageAccessPermissionStatus.UNKNOWN
      val packageName = context.packageName
      val mode = readUsageStatsOpMode(appOps, packageName)
      UsageAccessStatusMapping.fromAppOpsMode(mode)
    } catch (_: RuntimeException) {
      UsageAccessPermissionStatus.UNKNOWN
    }
  }

  private fun readUsageStatsOpMode(appOps: AppOpsManager, packageName: String): Int {
    val uid = Process.myUid()
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        uid,
        packageName,
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, uid, packageName)
    }
  }
}
