package com.aevora.losthours.tracking.bridge

import com.aevora.losthours.tracking.appmetadata.ResolvedAppMetadata
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

/** Maps resolved app metadata to React Native bridge payloads. */
object AppMetadataBridgeMapper {
  data class BridgeDto(
    val packageName: String,
    val displayName: String?,
  )

  fun toBridgeDto(metadata: ResolvedAppMetadata): BridgeDto {
    return BridgeDto(
      packageName = metadata.packageName,
      displayName = metadata.displayName,
    )
  }

  fun toWritableMap(metadata: ResolvedAppMetadata): WritableMap {
    val dto = toBridgeDto(metadata)
    return Arguments.createMap().apply {
      putString("packageName", dto.packageName)
      if (dto.displayName != null) {
        putString("displayName", dto.displayName)
      }
    }
  }

  fun toWritableArray(metadataList: List<ResolvedAppMetadata>): WritableArray {
    val array = Arguments.createArray()
    for (metadata in metadataList) {
      array.pushMap(toWritableMap(metadata))
    }
    return array
  }
}
