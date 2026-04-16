---
id: ref-threading-and-deferral
title: Threading, scheduling, and deferral in Max for Live
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: official
confidence: medium
source: "https://docs.cycling74.com/legacy/max8/vignettes/jsliveapi; https://docs.cycling74.com/reference/defer; https://docs.cycling74.com/reference/deferlow"
last_verified: 2026-04-16
related: [ref-liveapi-js-notes, principle-undo-discipline]
---

# Threading, scheduling, and deferral

Max runs code on multiple threads. Which thread your code is on determines
what you can and cannot safely do — LiveAPI in particular is not safe on
every thread. Getting this wrong produces crashes, silent no-ops, or undo
pollution. This was the single most dangerous gap in the previous version of
this repo.

## Threads in play

**Main thread (low priority).** Most UI updates, patch-loading, and JS
callbacks run here. The Live API is safe to use.

**Scheduler (high priority).** Audio-rate and timing-critical events run
here. Objects like `[metro]`, `[tempo]`, and audio-rate messages tick from
here. **The LiveAPI cannot be used from the high-priority thread.** Touching
it from there is undefined at best.

**Audio thread.** Signal processing. You don't touch LiveAPI from here at all,
ever. `[gen~]` and audio DSP live here.

## The `immediate` JS property

Max 6+ allows JS functions to run in the high-priority scheduler thread via
the `immediate` property in the JS inspector. **Do not enable this for
functions that touch LiveAPI.** The Live API cannot run in that thread.

## Deferring: `[defer]` and `[deferlow]`

Both objects take a message from any thread and re-fire it on the main
(low-priority) thread. `[defer]` queues the message; `[deferlow]` queues it
at lower priority so UI-paint work can happen first.

Use `[defer]` or `[deferlow]` when:

- A `[metro]` or other scheduler-driven message needs to trigger a LiveAPI
  operation.
- A `[live.observer]` callback wants to write back to Live (you can't write
  from inside the callback).
- A Max window (e.g. a dialog) should only open after the current message
  pass has completed.

Rule of thumb: **messages crossing the thread boundary into LiveAPI territory
go through `[defer]`.**

## In JavaScript: the `Task` object

For the JS equivalent of deferral, use the `Task` constructor:

```javascript
var writeBack = new Task(doWrite);

function onObserverFires(args) {
  // cannot call api.set() here — it's an observer callback
  writeBack.schedule(0);   // run on next main-thread tick
}

function doWrite() {
  api.set("something", 42);   // safe here
}
```

`Task.schedule(N)` runs the task N milliseconds from now. `Task.execute()`
runs it synchronously (use with care — same-thread constraints still apply).

## Initialization: `live.thisdevice`

The Live API is not guaranteed ready at JS load time. **`live.thisdevice`
bangs its left outlet when the device is fully initialized**, including its
connection to the Live API. All LiveAPI-dependent setup should hang off that
bang:

```
 [live.thisdevice]
        |
   [js my-script.js]
```

```javascript
// No top-level LiveAPI construction!
function bang() {
  // LiveAPI is safe to use from here.
  init();
}
```

Ignoring this produces race conditions on patch load that are hard to
reproduce — "it worked for me" kinds of bugs.

## Writing from inside a callback

A `[live.observer]` callback (in a patch) or a `LiveAPI` callback (in JS) is
running on the thread that fired the notification, not a thread where you're
free to write. **Writes must be deferred.**

In a patch:

```
[live.observer] → [defer] → [live.object]  (set ...)
```

In JS: the `Task` pattern above.

## Why this matters for undo

Undo flooding (see `docs/principles/undo-discipline.md`) is often a consequence
of cross-thread writes that fire on every tick of a high-rate source without
deferring. The solution isn't just "defer" — it's to ask whether the write
should happen at all (use `[live.remote~]` for internal modulation that
shouldn't generate undo).

## What this file does not cover

- The exact priority ordering between `[defer]` and `[deferlow]` when multiple
  deferred messages are queued in the same tick. (Observed to be "defer runs
  first, then deferlow" — but we haven't captured this from an official source.
  Flagged as `evidence: inference` if anyone writes a note depending on it.)
- The audio-thread constraints for `[jsaudio]` and `[gen~]`. (Out of scope
  for LiveAPI work; LiveAPI is not reachable from those threads at all.)
- Behavior of `[pipe]` for delayed scheduler-thread dispatch. (Occasionally
  useful as an alternative to Task. Add a note when a concrete use case
  arises.)

## References

- Max 8 LiveAPI JavaScript doc:
  https://docs.cycling74.com/legacy/max8/vignettes/jsliveapi
- `[defer]` reference: https://docs.cycling74.com/reference/defer
- `[deferlow]` reference: https://docs.cycling74.com/reference/deferlow
- `[live.thisdevice]` reference: https://docs.cycling74.com/reference/live.thisdevice
