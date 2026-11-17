package com.blockline.macrobenchmark

import androidx.benchmark.macro.CompilationMode
import androidx.benchmark.macro.ExperimentalMetricApi
import androidx.benchmark.macro.FrameTimingMetric
import androidx.benchmark.macro.MacrobenchmarkScope
import androidx.benchmark.macro.TraceSectionMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@OptIn(ExperimentalMetricApi::class)
@LargeTest
@RunWith(AndroidJUnit4::class)
class BlocklineEditorBenchmark {
    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun largeJavaScriptEditorTextReplacementAndScroll() = benchmarkRule.measureRepeated(
        packageName = TARGET_PACKAGE,
        metrics = listOf(
            FrameTimingMetric(),
            TraceSectionMetric(sectionName = "Blockline.SyntaxIndex")
        ),
        compilationMode = CompilationMode.None(),
        iterations = 5,
        setupBlock = {
            device.executeShellCommand("am force-stop $TARGET_PACKAGE")
            startActivityAndWait()
            val sample = waitForText("Blockline Sample", 3_000)
            if (sample != null) {
                sample.click()
            } else {
                waitForText("Create sample project", 15_000)?.click()
                    ?: error("Could not find the sample-project action.")
            }

            waitForText("Open Explorer", 15_000)?.click()
                ?: error("Could not open the project explorer.")
            waitForText("BP", 15_000)?.click()
                ?: error("Could not expand the Behavior Pack.")
            waitForText("BP/scripts", 15_000)?.click()
                ?: error("Could not expand the scripts folder.")
            waitForText("BP/scripts/main.js", 15_000)?.click()
                ?: error("Could not open the sample JavaScript file.")
            waitForEditor()
        }
    ) {
        waitForEditor().setText(largeJavaScript(System.nanoTime().toInt()))
        device.waitForIdle()

        // Re-query because the editor swaps from Compose BasicTextField to native EditText
        // after the document crosses the large-editor threshold.
        val editor = waitForEditor()
        editor.setGestureMargin((device.displayHeight / 5).coerceAtLeast(1))
        editor.fling(Direction.DOWN)
        editor.fling(Direction.UP)
    }

    private fun MacrobenchmarkScope.waitForText(text: String, timeoutMs: Long): UiObject2? =
        device.wait(Until.findObject(By.text(text)), timeoutMs)

    private fun MacrobenchmarkScope.waitForEditor(): UiObject2 =
        requireNotNull(device.wait(Until.findObject(By.res("blockline_editor_input")), 15_000)) {
            "The benchmark editor input was not exposed to UI Automator."
        }

    private fun largeJavaScript(revision: Int): String = buildString {
        append("// Blockline Kotlin baseline; revision ").append(revision).append('\n')
        repeat(420) { index ->
            append("const benchmarkEntity").append(index)
                .append(" = { id: \"minecraft:entity_").append(index)
                .append("\", health: ").append(10 + index % 20)
                .append(", enabled: ").append(index % 2 == 0)
                .append(", revision: ").append(revision)
                .append(" };\n")
        }
    }

    private companion object {
        const val TARGET_PACKAGE = "com.blockline.app.benchmark"
    }
}
