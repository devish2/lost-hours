package com.aevora.losthours.tracking.usageaccess

import android.app.AppOpsManager
import org.junit.Assert.assertEquals
import org.junit.Test

class UsageAccessStatusMappingTest {
  @Test
  fun mapsAllowedToGranted() {
    assertEquals(
      UsageAccessPermissionStatus.GRANTED,
      UsageAccessStatusMapping.fromAppOpsMode(AppOpsManager.MODE_ALLOWED),
    )
  }

  @Test
  fun mapsDefaultAndIgnoredToDenied() {
    assertEquals(
      UsageAccessPermissionStatus.DENIED,
      UsageAccessStatusMapping.fromAppOpsMode(AppOpsManager.MODE_DEFAULT),
    )
    assertEquals(
      UsageAccessPermissionStatus.DENIED,
      UsageAccessStatusMapping.fromAppOpsMode(AppOpsManager.MODE_IGNORED),
    )
  }

  @Test
  fun mapsErroredAndUnknownModesToUnknown() {
    assertEquals(
      UsageAccessPermissionStatus.UNKNOWN,
      UsageAccessStatusMapping.fromAppOpsMode(AppOpsManager.MODE_ERRORED),
    )
    assertEquals(
      UsageAccessPermissionStatus.UNKNOWN,
      UsageAccessStatusMapping.fromAppOpsMode(-1),
    )
  }
}
