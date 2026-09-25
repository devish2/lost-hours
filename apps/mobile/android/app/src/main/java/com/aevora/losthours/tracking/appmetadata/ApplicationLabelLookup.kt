package com.aevora.losthours.tracking.appmetadata

/** Resolves a human-readable application label for a package, or null when unavailable. */
fun interface ApplicationLabelLookup {
  fun getApplicationLabel(packageName: String): CharSequence?
}
