package com.aevora.losthours.tracking.appmetadata

import com.facebook.react.bridge.ReadableArray

/** Parses and deduplicates package names from the React Native bridge. */
object AppMetadataRequestParser {
  fun parsePackageNames(packageNames: ReadableArray?): List<String> {
    if (packageNames == null || packageNames.size() == 0) {
      return emptyList()
    }
    val uniqueOrdered = LinkedHashSet<String>()
    for (index in 0 until packageNames.size()) {
      if (packageNames.isNull(index)) {
        continue
      }
      val value = packageNames.getString(index)?.trim()
      if (!value.isNullOrEmpty()) {
        uniqueOrdered.add(value)
      }
    }
    return uniqueOrdered.toList()
  }
}
