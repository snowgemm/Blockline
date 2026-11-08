# Blockline performance baseline

This document defines the first reproducible Android startup benchmark. It measures the
Kotlin/Compose app before any Rust migration so later changes can be compared against the
same workload.

## Benchmark target

- Variant: `benchmark`
- Application ID: `com.blockline.app.benchmark`
- Debuggable: `false`
- Minification: disabled, matching the current release configuration
- Update channel: disabled to avoid update checks affecting the run
- Metric: cold-start `timeToInitialDisplay` and `timeToFullDisplay`
- Iterations: 10
- Compilation mode: `CompilationMode.None()`

The benchmark variant uses a separate application ID and debug signing key. It can be
installed alongside the stable and test apps without replacing either one.

## Run on a physical device

Use a physical Android device, close background workloads, keep battery and thermal
conditions stable, and repeat the same test after each performance change.

```bash
gradle :macrobenchmark:connectedBenchmarkAndroidTest
```

Android Studio's Build Variants panel should select `benchmark` for both `:app` and
`:macrobenchmark`. The benchmark module is also compiled in pull-request CI with:

```bash
gradle :macrobenchmark:assembleBenchmark
```

Macrobenchmark writes timing output and trace files under the module's connected test
output directory. Preserve the JSON result and trace with the device model, Android API
level, Blockline commit, and test conditions.

## Comparison rules

- Compare Kotlin and Rust implementations on the same device and Android build.
- Keep the input files and iteration count identical.
- Compare median and tail latency, not one run.
- Track startup, frame timing, memory/PSS, APK size, and battery separately.
- Do not treat emulator results as representative of physical-device performance.
- API 34+ is preferred for repeatable compilation-state handling. On earlier Android
  versions, follow Macrobenchmark's documented compilation-mode limitations.

This first benchmark measures startup only. Editor typing, scrolling, syntax indexing,
large-file opening, and search need separate workloads before they can be used to justify
a Rust migration. No performance claim should be made until physical-device results exist.
