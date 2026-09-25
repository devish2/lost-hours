package com.aevora.losthours.tracking.appmetadata

/** Human-readable label metadata for one Android package (displayName may be absent). */
data class ResolvedAppMetadata(
  val packageName: String,
  val displayName: String?,
)
