package com.aevora.losthours.tracking.appmetadata

import android.content.pm.PackageManager
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AppMetadataResolverTest {
  @Test
  fun emptyInputReturnsEmptyList() {
    val resolver = AppMetadataResolver { null }
    assertEquals(emptyList<ResolvedAppMetadata>(), resolver.resolveMetadata(emptyList()))
  }

  @Test
  fun deduplicatesAndTrimsPackageNames() {
    val resolver =
      AppMetadataResolver { packageName ->
        when (packageName) {
          "com.example.one" -> "One"
          else -> null
        }
      }
    val result =
      resolver.resolveMetadata(
        listOf(
          " com.example.one ",
          "com.example.one",
          "",
          "com.example.two",
        ),
      )
    assertEquals(2, result.size)
    assertEquals("com.example.one", result[0].packageName)
    assertEquals("One", result[0].displayName)
    assertEquals("com.example.two", result[1].packageName)
    assertNull(result[1].displayName)
  }

  @Test
  fun onePackageFailureDoesNotFailBatch() {
    val resolver =
      AppMetadataResolver { packageName ->
        when (packageName) {
          "com.example.bad" -> throw PackageManager.NameNotFoundException(packageName)
          "com.example.good" -> "Good App"
          else -> null
        }
      }
    val result =
      resolver.resolveMetadata(
        listOf("com.example.bad", "com.example.good"),
      )
    assertEquals(2, result.size)
    assertEquals("com.example.bad", result[0].packageName)
    assertNull(result[0].displayName)
    assertEquals("com.example.good", result[1].packageName)
    assertEquals("Good App", result[1].displayName)
  }

  @Test
  fun blankLabelsAreOmitted() {
    val resolver = AppMetadataResolver { "   " }
    val result = resolver.resolveMetadata(listOf("com.example.app"))
    assertEquals(1, result.size)
    assertNull(result[0].displayName)
  }
}
