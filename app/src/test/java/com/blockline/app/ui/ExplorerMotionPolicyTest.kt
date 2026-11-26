package com.blockline.app.ui

import org.junit.Assert.assertEquals
import org.junit.Test

class ExplorerMotionPolicyTest {
    @Test
    fun folderChevronPointsDownWhenExpanded() {
        assertEquals(90f, ExplorerMotionPolicy.chevronRotation(expanded = true))
    }

    @Test
    fun folderChevronPointsRightWhenCollapsed() {
        assertEquals(0f, ExplorerMotionPolicy.chevronRotation(expanded = false))
    }

    @Test
    fun folderMotionRespectsSystemAnimationSetting() {
        assertEquals(150, ExplorerMotionPolicy.durationMillis(systemAnimationsEnabled = true))
        assertEquals(0, ExplorerMotionPolicy.durationMillis(systemAnimationsEnabled = false))
    }
}
