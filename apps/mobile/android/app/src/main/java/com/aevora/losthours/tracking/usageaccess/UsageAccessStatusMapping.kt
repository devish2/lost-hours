package com.aevora.losthours.tracking.usageaccess

import android.app.AppOpsManager

/**
 * Maps {@link AppOpsManager} op modes for {@code OPSTR_GET_USAGE_STATS} to normalized status strings.
 */
object UsageAccessStatusMapping {
  fun fromAppOpsMode(mode: Int): String {
    return when (mode) {
      AppOpsManager.MODE_ALLOWED -> UsageAccessPermissionStatus.GRANTED
      AppOpsManager.MODE_DEFAULT,
      AppOpsManager.MODE_IGNORED,
      -> UsageAccessPermissionStatus.DENIED
      AppOpsManager.MODE_ERRORED -> UsageAccessPermissionStatus.UNKNOWN
      else -> UsageAccessPermissionStatus.UNKNOWN
    }
  }
}
