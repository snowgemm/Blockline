# Blockline Android performance baseline

This is the reproducible **Kotlin-only baseline** for the Rust evaluation. It deliberately
benchmarks a separate `com.blockline.app.benchmark` installation so the benchmark project
and edited fixture do not modify data owned by the stable Blockline app.

## What is measured

| Benchmark | Workload | Metric |
|---|---|---|
| `coldStartup` | 10 cold launches | `StartupTimingMetric` |
| `largeJavaScriptEditorTextReplacementAndScroll` | 5 repetitions; replace the sample JS document with a generated ~40 KB source file, let syntax indexing run, then fling through the editor | `FrameTimingMetric` and `TraceSectionMetric("Blockline.SyntaxIndex")` |

The editor benchmark uses the existing editor implementation and its Kotlin
`CheckpointedSyntaxDocument`. It performs one accessibility-driven whole-document text
replacement rather than simulating individual keyboard events. The trace section brackets
the syntax-index build only; the frame metric captures UI frame production during text
replacement and scrolling.
The source remains below the existing 1 MiB read-only threshold. This benchmark does not
claim to test editing multi-megabyte documents.

## Build and run

Requirements:

- Android Studio / Android SDK matching API 35 and JDK 17.
- A physical Android phone; API 34 or later is preferred for repeatable benchmark runs.
- Keep battery, thermal state, display refresh rate, and background load consistent.
- The app and benchmark APKs use a dedicated benchmark build variant.

```bash
gradle testDebugUnitTest
gradle assembleDebug
gradle :macrobenchmark:assembleBenchmark
gradle :macrobenchmark:connectedBenchmarkAndroidTest
```

Run the connected benchmark on the same physical phone before and after each engine change.
Do not compare emulator timings with physical-device results. Keep the generated JSON,
trace files, device model, Android API, app commit, and test conditions together.

## How to interpret results

- Compare medians and tail percentiles, not a single run.
- For scrolling, inspect `frameDurationCpuMs` and, on API 31+, `frameOverrunMs`.
  Positive high-percentile frame overrun indicates missed frame deadlines.
- Compare the `Blockline.SyntaxIndex` trace duration across implementations using the
  same source fixture, phone, build variant, and iteration settings.
- Also record APK size, memory/PSS, typing responsiveness, save latency, and thermal
  behavior before accepting a Rust implementation.
- Macrobenchmark compilation mode is `CompilationMode.None()`; preserve this setting for
  the Kotlin/Rust comparison.

## Baseline status

The harness is checked into the repository, but **no physical-device timing result is
recorded yet**. CI only compiles the benchmark APKs; it does not produce performance
numbers. Capture the first baseline on a real device before using the results to justify
Rust migration.
