package com.blockline.app.ui

internal object ExplorerMotionPolicy {
    const val FOLDER_CHEVRON_DURATION_MILLIS = 150

    fun chevronRotation(expanded: Boolean): Float = if (expanded) 90f else 0f

    fun durationMillis(systemAnimationsEnabled: Boolean): Int =
        if (systemAnimationsEnabled) FOLDER_CHEVRON_DURATION_MILLIS else 0
}
