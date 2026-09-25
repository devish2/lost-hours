package com.aevora.losthours.tracking.bridge

import com.aevora.losthours.tracking.appmetadata.ResolvedAppMetadata
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AppMetadataBridgeMapperTest {
  @Test
  fun convertsResolvedMetadataToBridgeDto() {
    val withLabel =
      AppMetadataBridgeMapper.toBridgeDto(
        ResolvedAppMetadata("com.example.app", "Example"),
      )
    assertEquals("com.example.app", withLabel.packageName)
    assertEquals("Example", withLabel.displayName)

    val withoutLabel =
      AppMetadataBridgeMapper.toBridgeDto(
        ResolvedAppMetadata("com.example.missing", null),
      )
    assertEquals("com.example.missing", withoutLabel.packageName)
    assertNull(withoutLabel.displayName)
  }
}
