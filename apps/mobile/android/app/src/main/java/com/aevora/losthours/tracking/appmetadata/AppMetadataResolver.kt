package com.aevora.losthours.tracking.appmetadata

import android.content.Context
import android.content.pm.PackageManager

/** Batch-resolves PackageManager labels for requested package names only. */
class AppMetadataResolver(
  private val labelLookup: ApplicationLabelLookup,
) {
  fun resolveMetadata(requestedPackageNames: Iterable<String>): List<ResolvedAppMetadata> {
    val uniqueOrdered = LinkedHashSet<String>()
    for (raw in requestedPackageNames) {
      val trimmed = raw.trim()
      if (trimmed.isNotEmpty()) {
        uniqueOrdered.add(trimmed)
      }
    }
    return uniqueOrdered.map { packageName ->
      ResolvedAppMetadata(
        packageName = packageName,
        displayName = resolveDisplayName(packageName),
      )
    }
  }

  private fun resolveDisplayName(packageName: String): String? {
    val label =
      try {
        labelLookup.getApplicationLabel(packageName)
      } catch (_: PackageManager.NameNotFoundException) {
        null
      } catch (_: RuntimeException) {
        null
      }
    val trimmed = label?.toString()?.trim()
    return if (trimmed.isNullOrEmpty()) null else trimmed
  }

  companion object {
    fun fromContext(context: Context): AppMetadataResolver {
      val packageManager = context.packageManager
      val lookup =
        ApplicationLabelLookup { packageName ->
          val info = packageManager.getApplicationInfo(packageName, 0)
          packageManager.getApplicationLabel(info)
        }
      return AppMetadataResolver(lookup)
    }
  }
}
