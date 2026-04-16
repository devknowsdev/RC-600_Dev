---
id: ref-liveapi-js-notes
title: LiveAPI in JavaScript — operational notes
surface: liveapi-js
live_version: "12.1"
max_version: "8.6"
evidence: official
confidence: high
source: "https://docs.cycling74.com/legacy/max8/vignettes/jsliveapi"
last_verified: 2026-04-16
related: [ref-liveapi-cheatsheet, ref-threading-and-deferral]
---

# LiveAPI in JavaScript — operational notes

Supplements the main cheatsheet. Focuses on the things that bite people
specifically in `[js]` and `[jsui]` contexts.

## Initialization

You **cannot** create a `LiveAPI` object in JS global (top-level) code. The Live
API is not guaranteed to be ready when the JS file first loads. The correct
pattern is to wait for `live.thisdevice` to bang, which signals that the
device (and the API) is fully initialized.

```
  [live.thisdevice]
         |
      [js my-script.js]
```

In `my-script.js`:

```javascript
// DO NOT do this at top level:
// var api = new LiveAPI("live_set");   // will fail unpredictably

function bang() {
  // Called when live.thisdevice fires.
  init();
}

var api;
function init() {
  api = new LiveAPI("live_set");
  // safe to use now
}
```

## The `immediate` property and threading

Max 6.0 and later allow JS functions to be flagged `immediate` to run in the
high-priority scheduler thread. **Do not do this for anything that touches
LiveAPI.** The Live API cannot be used from the high-priority thread. If you
need high-priority behavior alongside LiveAPI work, split the concerns: keep
LiveAPI work in normal-priority functions, defer or queue work from
high-priority triggers.

## Writing from inside a callback

You cannot modify the Live Set from inside an observer callback. Doing so is
disallowed by the API and can error or behave unpredictably. If a callback
needs to write:

- in a patch: route through `[defer]` or `[deferlow]`;
- in JS: use the `Task` object to re-dispatch.

Task example:

```javascript
var pendingWrite = new Task(doWrite);

function onSomethingChanged(args) {
  // cannot call api.set() here
  pendingWrite.schedule(0);  // fire on next main-thread tick
}

function doWrite() {
  api.set("something", 42);  // safe here
}
```

## Observer lifecycle

The big constraint: **there is no way to unregister a JavaScript-side observer
callback.** Once you've created a `LiveAPI` with a callback and assigned its
`.property`, that registration persists until the host device is unloaded.
Creating new observer instances every time a context changes leaks.

The idiomatic workaround is to keep a small pool of observer instances and
**repoint** them rather than recreate:

```javascript
var trackNameObs;

function bang() {
  trackNameObs = new LiveAPI(onTrackName);  // create once
  bindToSelected();
}

function bindToSelected() {
  var sel = new LiveAPI("live_set view selected_track");
  if (sel.id == 0) return;

  trackNameObs.id = sel.id;         // repoint
  trackNameObs.property = "name";   // (re-)arm the observation
}

function onTrackName(args) {
  post("name: " + args + "\n");
}
```

This is the single biggest architectural choice in any non-trivial LiveAPI
JS utility. See `docs/principles/observer-architecture.md`.

## Callback argument shape

When a `LiveAPI` callback fires, it receives a single argument (typically
named `args`) which is an array. The contents depend on the property being
observed:

- For a scalar property (`mute`, `name`, `value`, `tempo`, etc.): typically a
  two-element list `[ "<propname>", <value> ]`.
- For a list child (`tracks`, `devices`, `parameters`): typically a list of id
  tokens — e.g. `["id", 42, "id", 43, ...]` — with the `id` keyword
  interleaved. Shape has varied slightly across Max versions; when working
  with a list-child observation for the first time, log `args` and examine it
  rather than assume.
- On path change / id change: a single list containing the id-tokens of the
  new target.

When uncertain, start with:

```javascript
function sampleCallback(args) {
  post("callback: " + JSON.stringify(args) + "\n");
}
```

And build from the observed shape.

## `getcount` in JS

```javascript
var nTracks = new LiveAPI("live_set").getcount("tracks");  // number
```

Returns a number. Always use this before iterating; the list length is not
otherwise exposed.

## `getstring` and list-valued properties

Some properties return lists of symbols or dictionaries rather than scalars.
For lists, `get()` returns an array. For dictionary-valued properties (like
`input_routing_channel`), `get()` returns the dictionary representation. When
you want the literal string Live shows, many properties now have a
corresponding `display_value` or similar companion — check the LOM page for
the object.

## `call` with arguments

Methods that take arguments receive them as trailing args:

```javascript
var song = new LiveAPI("live_set");
song.call("create_audio_track", -1);   // -1 = at end

var scene = new LiveAPI("live_set scenes 0");
scene.call("fire");
```

Methods returning a value return it from `call()`:

```javascript
var newScene = song.call("create_scene", -1);   // returns id of new scene
```

## Mode: "follows object" vs "follows path"

`LiveAPI` has a `mode` property (0 or 1):

- `mode = 0` (default) — follows object. If you have `live_set tracks 0` and
  then the user drags Track 1 to the left, your LiveAPI now points at the
  same original track (which is now at index 1). The **object identity is
  preserved.**
- `mode = 1` — follows path. If you have `live_set tracks 0` and the user
  drags, your LiveAPI continues to point at whatever is at index 0 — now a
  different track.

Most utilities want the default. Deterministic batch tools operating on
structural position want `mode = 1`.

## Performance notes

- Every `new LiveAPI(...)` call does path resolution. In tight loops, cache.
- Reading `api.info` is an expensive introspection dump. Don't do it per frame.
- Meter properties (`input_meter_left`, `output_meter_right`, etc.) are
  documented as adding significant GUI load. Avoid observing them unless
  actually needed; consider throttling if you do.
- Observing a list-child (e.g. `tracks`) fires on every list mutation, not
  just on changes to individual elements. Observing `tracks` to react to
  track add/remove is correct; observing it to react to a track property
  change is the wrong tool.

## What to keep in your head

- Wait for `live.thisdevice` bang before touching LiveAPI.
- Don't use `immediate` with LiveAPI.
- Don't write inside a callback — defer.
- Create observers once, repoint them; don't churn instances.
- Log `args` the first time you hit a new callback; don't assume the shape.
- `api.id == 0` means the path didn't resolve.
