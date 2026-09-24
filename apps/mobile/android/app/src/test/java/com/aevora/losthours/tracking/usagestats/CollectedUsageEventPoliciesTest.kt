package com.aevora.losthours.tracking.usagestats

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CollectedUsageEventPoliciesTest {
  @Test
  fun validatesPackageNames() {
    assertFalse(CollectedUsageEventPolicies.isValidPackageName(null))
    assertFalse(CollectedUsageEventPolicies.isValidPackageName(""))
    assertFalse(CollectedUsageEventPolicies.isValidPackageName("   "))
    assertTrue(CollectedUsageEventPolicies.isValidPackageName("com.example.app"))
  }

  @Test
  fun enforcesHalfOpenInterval() {
    assertTrue(CollectedUsageEventPolicies.isWithinHalfOpenRange(100L, 100L, 200L))
    assertFalse(CollectedUsageEventPolicies.isWithinHalfOpenRange(200L, 100L, 200L))
    assertFalse(CollectedUsageEventPolicies.isWithinHalfOpenRange(99L, 100L, 200L))
  }

  @Test
  fun sortsDeterministically() {
    val input =
      listOf(
        CollectedUsageEvent("com.b", 200L, NativeUsageEventType.BACKGROUND),
        CollectedUsageEvent("com.a", 200L, NativeUsageEventType.FOREGROUND),
        CollectedUsageEvent("com.a", 100L, NativeUsageEventType.FOREGROUND),
      )
    val sorted = CollectedUsageEventPolicies.sortDeterministic(input)
    assertEquals(100L, sorted[0].timestamp)
    assertEquals("com.a", sorted[0].packageName)
    assertEquals(200L, sorted[1].timestamp)
    assertEquals("com.a", sorted[1].packageName)
    assertEquals(200L, sorted[2].timestamp)
    assertEquals("com.b", sorted[2].packageName)
  }
}
