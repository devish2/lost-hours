package com.aevora.losthours.tracking.usageaccess

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings

/**
 * Opens Android Usage Access settings. Prefers a package-scoped destination when resolvable,
 * then falls back to the general Usage Access settings screen.
 */
class UsageAccessSettingsNavigator(private val context: Context) {
  /**
   * @return {@code true} if a settings activity was started, {@code false} if no destination could
   *   be opened safely.
   */
  fun openUsageAccessSettings(): Boolean {
    val appContext = context.applicationContext
    val packageName = appContext.packageName

    val packageScoped =
      Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        data = Uri.parse("package:$packageName")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
    if (tryStartActivity(appContext, packageScoped)) {
      return true
    }

    val general =
      Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
    return tryStartActivity(appContext, general)
  }

  private fun tryStartActivity(context: Context, intent: Intent): Boolean {
    return try {
      if (intent.resolveActivity(context.packageManager) == null) {
        return false
      }
      context.startActivity(intent)
      true
    } catch (_: ActivityNotFoundException) {
      false
    } catch (_: SecurityException) {
      false
    }
  }
}
