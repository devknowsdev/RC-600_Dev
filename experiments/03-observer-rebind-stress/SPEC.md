---
id: exp-03-observer-rebind-stress
title: "Experiment 03: Observer rebind stress test"
surface: liveapi-js
live_version: "12.x"
max_version: "8.6"
evidence: open
confidence: low
last_verified: 2026-04-16
related: [principle-observer-architecture, ref-liveapi-js-notes]
---

# Experiment 03: Observer rebind stress test

## Hypothesis

A Max for Live JS utility that creates new `LiveAPI` callback instances on
every selection change (the naive pattern) will exhibit monotonically
growing memory or CPU usage over hundreds of selection changes, because
JavaScript LiveAPI observers cannot be unregistered. A utility that
repoints a fixed pool of observers (the recommended pattern) will show
flat resource usage under the same workload.

## Why this matters

Upgrades `principle-observer-architecture` from `evidence: inference` to
`evidence: experiment`. Provides a concrete benchmark for the "create
once, repoint" recommendation.

## Target environment

- Live: 12.1 (or current stable)
- Max: 8.6
- OS: record which
- A Live Set with at least 8 tracks of varying types.

## Setup

Build two M4L Audio Effect devices:

**Device A: `observer-naive.amxd`**

JS script `observer-naive.js`:

```javascript
// INTENTIONALLY BAD — creates a new observer on every selection change
var selObs;

function bang() {
  selObs = new LiveAPI(onSelChanged, "live_set view");
  selObs.property = "selected_track";
}

function onSelChanged(args) {
  // Create a NEW observer every time — the leak pattern
  var nameObs = new LiveAPI(function(a) {
    post("name: " + a + "\n");
  });
  var t = new LiveAPI("live_set view selected_track");
  if (t.id == 0) return;
  nameObs.id = t.id;
  nameObs.property = "name";
}
```

**Device B: `observer-pooled.amxd`**

JS script `observer-pooled.js`:

```javascript
// CORRECT — reuses a single observer
var selObs, nameObs;

function bang() {
  selObs = new LiveAPI(onSelChanged, "live_set view");
  selObs.property = "selected_track";
  nameObs = new LiveAPI(onName);
  bindTarget();
}

function onSelChanged(args) { bindTarget(); }

function bindTarget() {
  var t = new LiveAPI("live_set view selected_track");
  if (t.id == 0) { nameObs.id = 0; return; }
  nameObs.id = t.id;
  nameObs.property = "name";
}

function onName(args) {
  post("name: " + args + "\n");
}
```

Create `assets/starter.als` with both devices on separate tracks, plus
8 additional tracks (mix of audio, MIDI, group).

## Method

1. Open `starter.als`. Note initial Live CPU meter reading.
2. **Baseline.** Click through all 8 tracks sequentially, 3 times (24
   selection changes). Note CPU meter and any sluggishness.
3. **Stress phase.** Using keyboard shortcuts (up/down arrow in Session
   View), rapidly change selection ~500 times over ~60 seconds. This
   is aggressive but represents a real "scrolling through tracks
   quickly" workflow.
4. After 500 changes, note:
   - Live CPU meter reading.
   - Max Window output — any errors, any "out of memory" warnings.
   - Subjective responsiveness — does the device still post track names
     immediately on selection change?
5. Repeat the 500-change stress. Note again.
6. Remove Device A from the set. Repeat the 500-change stress with
   only Device B. Compare.

## Measurement

| Metric | Instrument | Recording |
| --- | --- | --- |
| CPU usage trend | Live's CPU meter (top right) at each checkpoint | Table in RUNLOG.md |
| Max Window errors | Max Window / Console log | Copy to results/console.log |
| Memory growth | Activity Monitor (macOS) or Task Manager (Windows) — track the Max/Live process RSS at each checkpoint | Table in RUNLOG.md |
| Callback responsiveness | Subjective: does the track name post within ~100ms of selection change? | Note in RUNLOG.md |

## Expected outcomes

**Primary:** Device A (naive) shows measurable memory growth after 500+
selection changes. Device B (pooled) shows flat memory.

**Alternative outcomes:**

- Both devices show flat memory — Max's GC may collect orphaned
  LiveAPI objects even though they "can't be unregistered." If so,
  the Cycling '74 forum advice is overly conservative, and the
  practical recommendation softens. Note this carefully — it would
  change the principle.
- Both devices show growth — Max may leak even the pooled pattern.
  Would indicate a platform bug. Capture the Max version precisely.
- Device A shows growth but plateaus — Max may have a fixed-size
  observer table. Note the plateau level and the number of changes
  that triggers it.

## Results

`results/` is empty until run.

## Cleanup

Close the set without saving. The experiment doesn't modify persistent
state.

## Variants to consider later

- Scale test: 100 tracks, 5000 selection changes.
- Observer on a list child (`tracks`) vs a scalar property (`name`) —
  different leak behavior?
- `[live.observer]` Max objects vs JS `LiveAPI` — does the Max-side
  observer have the same leak characteristic?
- Push interaction: does navigating tracks via Push trigger the same
  observers and the same leak?
