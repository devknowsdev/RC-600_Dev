---
id: principle-observer-architecture
title: Observer architecture in LiveAPI utilities
surface: liveapi-js
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: medium
last_verified: 2026-04-16
related: [ref-liveapi-js-notes, ref-threading-and-deferral, exp-03-observer-rebind-stress]
---

# Observer architecture

A trivial LiveAPI utility can survive with one observer and one callback.
A non-trivial one — anything that tracks selection, device parameters,
or clip state across a changing context — rapidly gets into trouble if
observers are wired naïvely. This note captures our working discipline.

Marked `evidence: inference` because while the constraints below are
grounded in the LiveAPI docs (see sources in the cheatsheet), the
architectural recommendations are reasoned from those constraints and
would benefit from the `exp-03-observer-rebind-stress` experiment.

---

## The hard constraints (from official docs)

These aren't opinions. They are facts about the LiveAPI and Max JS that
every observer design must respect:

1. **JavaScript LiveAPI observers cannot be unregistered.** Once you
   `new LiveAPI(cb)` and set `.property`, the registration persists
   until the device is unloaded.
2. **You cannot write to Live from inside an observer callback.**
   Deferral required.
3. **Object ids are not stable across set reloads.** Paths re-resolve;
   ids don't carry.
4. **A `LiveAPI` callback receives one argument**, typically an array
   starting with the property name. Exact shape varies by property type.
5. **LiveAPI is unsafe in the high-priority scheduler thread.** Don't
   mark observer-dispatching JS functions as `immediate`.

See `docs/reference/liveapi-js-notes.md` for sources.

---

## The three architectural tiers

### Tier 1: one-shot utilities (a single watched property)

Pattern: a small `[js]` that watches one thing and reports it. Observer
count: 1. No lifecycle concerns.

This is fine for diagnostic devices, single-purpose controllers, and
prototypes. Use simple direct wiring:

```javascript
var api;
function bang() {
  api = new LiveAPI(onChange, "live_set");
  api.property = "tempo";
}
function onChange(args) {
  post("tempo: " + args[1] + "\n");
}
```

When not to escalate: the device only cares about one thing, and that
thing's target object won't change while the device exists.

### Tier 2: context-aware utilities (one watcher, rebinding target)

Pattern: the device follows a context (e.g. "the selected track") and
tracks one property of whatever the context resolves to. Observer count:
1 context watcher + 1 target watcher.

This is where naive design leaks. Incorrect approach:

```javascript
// WRONG — leaks an observer on every selection change
function onSelectionChanged() {
  var track = new LiveAPI("live_set view selected_track");
  var nameObs = new LiveAPI(onName, track.id);  // new every time
  nameObs.property = "name";
}
```

Correct approach — reuse a single observer by repointing:

```javascript
var ctxObs, targetObs;

function bang() {
  ctxObs = new LiveAPI(onSelectionChanged, "live_set view");
  ctxObs.property = "selected_track";

  targetObs = new LiveAPI(onTargetProperty);  // no path yet
  bindTarget();
}

function onSelectionChanged(args) { bindTarget(); }

function bindTarget() {
  var t = new LiveAPI("live_set view selected_track");
  if (t.id == 0) {
    targetObs.id = 0;  // detach safely
    return;
  }
  targetObs.id = t.id;
  targetObs.property = "name";  // re-arm observation
}

function onTargetProperty(args) {
  post("name: " + args + "\n");
}
```

Key pattern elements:

- **Create observers once; repoint via `.id`.** Never instantiate new
  `LiveAPI` callbacks inside a context-change handler.
- **Handle `id 0` explicitly.** Don't assume the target always resolves.
- **Setting `.property` re-arms the observation on the current id.**

### Tier 3: compound utilities (multiple watched targets, dynamic list)

Pattern: the device tracks N things that come and go — all tracks' mutes,
all parameters on a device, all clips in a scene. Observer count: up to N.

This is where architecture starts mattering. The canonical pattern:

```
ObserverPool
  - has a list of slots, each capable of observing one target
  - on context change, computes the new list of targets
  - diffs against current bindings
  - repoints, attaches, detaches as needed
```

```javascript
// Sketch — not a complete implementation
function ObserverPool(callback) {
  this.slots = [];       // list of {id, api}
  this.callback = callback;
}

ObserverPool.prototype.bindTo = function(ids, property) {
  // Extend slot pool if needed
  while (this.slots.length < ids.length) {
    this.slots.push({id: 0, api: new LiveAPI(this.callback)});
  }
  // Repoint existing slots
  for (var i = 0; i < ids.length; i++) {
    this.slots[i].api.id = ids[i];
    this.slots[i].api.property = property;
    this.slots[i].id = ids[i];
  }
  // Detach trailing slots we no longer need
  for (var j = ids.length; j < this.slots.length; j++) {
    this.slots[j].api.id = 0;
    this.slots[j].id = 0;
  }
};
```

Note: we never shrink the pool (because we can't unregister). We detach
unused slots by pointing them at id 0. This costs a small amount of
memory but bounds the leak — if the user typically has 16 tracks, we
have 16 slots long-term, not 16-new-per-selection-change.

---

## Callback dispatch strategies

When one callback handles many observations, it needs to route events
to the right handler. Three patterns:

### A. One callback per observer kind

```javascript
var ctxObs = new LiveAPI(onContextChange, "live_set view");
ctxObs.property = "selected_track";

var tempoObs = new LiveAPI(onTempo, "live_set");
tempoObs.property = "tempo";

function onContextChange(args) { /* ... */ }
function onTempo(args) { /* ... */ }
```

Simple, readable. Preferred for small utilities.

### B. Shared callback with args-based dispatch

```javascript
function onChange(args) {
  var propName = args[0];
  if (propName === "selected_track") { /* ... */ }
  else if (propName === "tempo") { /* ... */ }
}
```

Useful when you have many observers watching different properties and
want centralized handling. The property name is in `args[0]` for most
scalar property observations.

### C. Wrapper object per observer

For complex cases, wrap each LiveAPI in a small object that knows what
it represents. The wrapper's callback translates into semantic events.

---

## Persistence

The `[live.observer]` Max object has a **"Use Persistent Mapping"**
inspector option. When enabled, the object's association with a specific
Live object (by id) survives Live Set save/reload. The JavaScript
`LiveAPI` equivalent works by remembering the path and re-resolving at
next bang of `live.thisdevice`.

Our working rule:

- For observers whose target is identified by **canonical path** (e.g.
  `live_set view selected_track`), rely on path-based re-resolution on
  reload.
- For observers whose target is a **specific user-chosen object**
  (e.g. "the device the user dragged onto me"), either use Persistent
  Mapping in `[live.observer]` or store a pattr-recoverable stable
  handle (not a raw id — ids don't survive).

---

## Testing observer health

See `experiments/03-observer-rebind-stress/`. The core test is: with
the device instantiated, rapidly change selection 1000 times. Check:

- Does Live's CPU or memory usage grow over time?
- Are events still delivered correctly at the end?
- Does closing and reopening the device clean up properly?

A correctly-architected utility has flat CPU and memory across this
stress test. A leaky one grows without bound.

---

## What not to do

- Do not create a new `LiveAPI` with a callback inside every
  notification-handler.
- Do not observe the entire `tracks` list to react to a change on any
  individual track. Observe the list to react to add/remove; observe
  individual tracks' properties separately for within-track changes.
- Do not store LiveAPI ids in a pattr or dict for long-term reuse —
  they won't be valid next session.
- Do not observe high-rate properties (meter levels, playing positions)
  unless you're actually going to use them at that rate. Meter
  properties specifically add GUI load per the LOM docs.
