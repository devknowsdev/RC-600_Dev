---
id: ref-liveapi-cheatsheet
title: Live API operational cheatsheet
surface: liveapi
live_version: "12.1"
max_version: "8.6"
evidence: official
confidence: high
source: "https://docs.cycling74.com/legacy/max8/vignettes/live_object_model; https://docs.cycling74.com/apiref/lom/"
last_verified: 2026-04-16
related: [ref-liveapi-js-notes, ref-lom-song, ref-lom-track, ref-lom-deviceparameter, ref-lom-mixerdevice]
---

# Live API operational cheatsheet

A short reference for working with the Live API through Max for Live. For
precise per-object fields, see the YAML files in `docs/reference/lom/`. This
cheatsheet is the working quick reference; the YAML is ground truth.

Anchored to Live 12.1 / Max 8.6. Features introduced in Live 12.2 or later are
flagged with `[12.2+]` or similar.

---

## 1. Mental model

The Live API exposes a tree of objects. You interact with them via three
tools, each suited to a different job:

- **`[live.path]`** — resolve a canonical path (a space-separated string) into
  an object id.
- **`[live.object]`** — get, set, or call methods on an object once you have
  its id.
- **`[live.observer]`** — get notified when a property changes.

In JavaScript inside a `[js]` object, the single class `LiveAPI` does all three.

## 2. Root paths

Four canonical roots exist:

| Root | What it refers to |
| --- | --- |
| `live_app` | The Live application itself (Application object). |
| `live_set` | The current Live Set (Song object). **Most work starts here.** |
| `control_surfaces N` | A specific control surface slot (0–5), if one is installed. |
| `this_device` | The device containing the `live.path` / `LiveAPI` caller. |

The old convention of "everything starts at `live_set`" is a simplification.
`control_surfaces` and `this_device` exist and matter — `this_device` in
particular is the correct way for a device to refer to itself without
hard-coding its position.

## 3. Object ids and the `id 0` gotcha

When a `[live.path]` resolves a path, it outputs `id N` where N is a runtime
handle. **If the path does not resolve, it outputs `id 0`.** Zero is the null
reference. Any code that does not check for it will misbehave — typically by
silently operating on nothing.

In JavaScript: `new LiveAPI("some/path").id` returns a string containing either
a real numeric id or `"0"`. Test explicitly:

```javascript
var api = new LiveAPI("live_set view selected_track");
if (api.id == 0) {
  // no selected track (shouldn't happen, but possible mid-load)
  return;
}
```

Ids are **not stable across Live Set reloads.** Do not store them. If you need
persistence, store the canonical path or a domain-specific handle and
re-resolve on load. (Note: `[live.observer]` has a "Use Persistent Mapping"
inspector option that makes its internal id survive save/reload — use it when
appropriate, but the id itself is still not a portable handle.)

## 4. Canonical paths

Paths are **space-separated** tokens that walk from a root through children.
List-type children take a numeric index (zero-based).

| Path | Type |
| --- | --- |
| `live_set` | Song |
| `live_set tracks 0` | Track (first track) |
| `live_set return_tracks 0` | Track (first return) |
| `live_set master_track` | Track (master) |
| `live_set tracks 0 devices 0` | Device (first device of first track) |
| `live_set tracks 0 devices 0 parameters 0` | DeviceParameter |
| `live_set tracks 0 mixer_device` | MixerDevice |
| `live_set tracks 0 clip_slots 0` | ClipSlot |
| `live_set tracks 0 clip_slots 0 clip` | Clip (if the slot has one) |
| `live_set scenes 0` | Scene |
| `live_set view` | Song.View |
| `live_set view selected_track` | Track (the currently selected one) |
| `live_set view detail_clip` | Clip (in the detail view) |
| `live_set view selected_parameter` | DeviceParameter `[12.1+]` |
| `live_set view highlighted_clip_slot` | ClipSlot |

## 5. The mixer parameter trap

**This was wrong in the previous repo.** Mixer parameters are **children of
MixerDevice, not path segments on Track.** They are `DeviceParameter` objects.

Correct way to reach track volume:

```
live_set tracks 0 mixer_device volume
```

The `volume` at the end is a **child object** of the MixerDevice — specifically
a DeviceParameter — and the path walks to it. Once resolved, you get its
DeviceParameter id, and you read/write the `value` property:

```javascript
var volApi = new LiveAPI("live_set tracks 0 mixer_device volume");
var v = volApi.get("value");      // internal 0.0..1.0 scale
var display = volApi.get("display_value");   // e.g. "-6.0 dB"
volApi.set("value", 0.85);
```

The MixerDevice children that exist on every track are `volume`, `panning`,
`track_activator`, and the `sends` list. On the master track specifically,
`cue_volume`, `crossfader`, and `song_tempo` also exist. On tracks where the
Pan Mode is set to Split Stereo, `left_split_stereo` and `right_split_stereo`
are the active pan params.

Sends are a **list**, one per return track, addressed by index:

```
live_set tracks 0 mixer_device sends 0
```

## 6. Reading and writing: `get`, `set`, `call`

With `[live.object]` in a patch, or with a `LiveAPI` object in JS:

| Operation | Max message | JS equivalent |
| --- | --- | --- |
| Read a scalar property | `get <propname>` | `api.get("propname")` |
| Read a stringified value | `getstring <propname>` | (read `display_value` or use `str_for_value`) |
| Write a property | `set <propname> <value>` | `api.set("propname", value)` |
| Call a method | `call <methodname> [args...]` | `api.call("methodname", ...)` |

`api.get()` returns an array for list-type values, a scalar otherwise. For
DeviceParameter, `get("value")` returns the internal numeric value and
`get("display_value")` returns the human-readable form (e.g. `"-6.0 dB"`,
`"Sine"`). `display_value` is the property; `str_for_value(v)` is a function
that formats an arbitrary value.

Not every property is settable. The LOM lists "observe", "get", "set" per
property. If a property only lists "get", calling `set` on it silently fails
(or errors, depending on version). Always check the LOM page for the object.

## 7. List lengths: `getcount`

**This was missing from the previous repo.** To know how many items are in a
list child, use `getcount`:

```
[live.object]: getcount tracks          → outputs "tracks <N>"
```

```javascript
var song = new LiveAPI("live_set");
var nTracks = song.getcount("tracks");     // number
for (var i = 0; i < nTracks; i++) {
  var t = new LiveAPI("live_set tracks " + i);
  // ...
}
```

Without this, you cannot safely iterate. Do not guess at list length; ask.

Similarly `getcount("devices")` on a Track, `getcount("parameters")` on a
Device, `getcount("scenes")` on a Song, `getcount("sends")` on a MixerDevice.

## 8. Observing changes

### In a patch

`[live.observer]` connected downstream of `[live.path]` via the right inlet.
Set its `property <name>` attribute to pick what to watch. When the property
changes, the new value appears at the left outlet.

The inspector option **"Use Persistent Mapping"** makes the object's id
persist across save/reload of the Live Set. Enable it for observers whose
path would otherwise need re-resolution on load.

### In JavaScript

`LiveAPI` takes an optional callback function. When you assign `.property =
"<name>"`, every change to that property fires the callback:

```javascript
var api = new LiveAPI(onMuteChanged, "live_set tracks 0");
api.property = "mute";

function onMuteChanged(args) {
  // args is a list. For a scalar property, it's typically
  // [ "mute", <newValue> ].  First element is usually the property name.
  // Exact shape depends on the property type — post(args) to inspect.
  post("mute changed: " + args + "\n");
}
```

The callback signature is `function(args)` where `args` is an array. For scalar
properties it usually contains the property name followed by the value. For
list children, it contains `id` tokens. When uncertain, log the `args` and
look at what Max prints.

### Observer constraints you must know

- **You cannot unregister an observer in JavaScript.** Creating many `LiveAPI`
  instances with callbacks leaks. Reuse, or create once and repoint via `.path`.
- **You cannot modify the Live Set from inside a notification callback.**
  Doing so is disallowed. If a callback needs to write, schedule the write via
  `[defer]` in a patch or the `Task` object in JS.
- **`LiveAPI` cannot be used in JS global code** at top level — wait for
  `live.thisdevice` to bang before touching the API.
- **`LiveAPI` cannot run in the high-priority scheduler thread.** Do not set
  `immediate` on JS functions that touch the API.

## 9. Observer rebinding when context changes

When you observe something derived from the UI (selection, detail view), the
underlying object reference changes as the user works. The canonical pattern:

1. Observe the **context** (e.g. `live_set view selected_track`).
2. When that context changes, resolve the new target id.
3. Rebuild any observers that were attached to the previous target.

```javascript
var selObs = null;
var boundTrackApi = null;
var nameObs = null;

function init() {
  selObs = new LiveAPI(onSelectionChanged, "live_set view");
  selObs.property = "selected_track";
  rebindToSelectedTrack();
}

function onSelectionChanged(args) {
  rebindToSelectedTrack();
}

function rebindToSelectedTrack() {
  boundTrackApi = new LiveAPI("live_set view selected_track");
  if (boundTrackApi.id == 0) return;

  // rebuild a lower-level observer for the new track
  nameObs = new LiveAPI(onNameChanged, boundTrackApi.id);
  nameObs.property = "name";
}

function onNameChanged(args) {
  post("name is now: " + args + "\n");
}
```

Note the observer reuse concern — the old `nameObs` is orphaned here. In a
long-running utility, prefer a pattern that nulls out and lets the old
observer be garbage-collected, or reuses a single observer by reassigning its
`.id`.

## 10. Paths vs ids

You can construct a `LiveAPI` with either a path string or an id token:

```javascript
new LiveAPI("live_set tracks 0 devices 0");
new LiveAPI("id 42");  // if 42 is a known runtime id
```

When you have an id already (typically from another `LiveAPI` or a callback),
passing it is cheaper than re-walking the path. But remember ids don't
survive set reload.

## 11. Selection-aware vs structural paths

Paths that go through `view` are UI-context-dependent. They are great for
tools that should operate on "whatever the user is looking at" and brittle for
tools that must operate on a known target. See
`docs/research/selection-vs-deterministic.md` for when to use which.

| Selection-aware | Structural |
| --- | --- |
| `live_set view selected_track` | `live_set tracks N` |
| `live_set view detail_clip` | `live_set tracks N clip_slots M clip` |
| `live_set view detail_device` | `live_set tracks N devices M` |
| `live_set view highlighted_clip_slot` | `live_set tracks N clip_slots M` |
| `live_set view selected_parameter` | `live_set tracks N devices M parameters P` |

## 12. Write side effects

Writes are not free. Setting a DeviceParameter value:

- creates an undo entry (unless the parameter is marked otherwise or the device
  is suspended),
- may interact with active automation (creating a breakpoint or being
  overridden, depending on the `automation_state`),
- fires notifications to any observers of that parameter.

For devices that internally modulate a parameter at high rate, this is the
undo-flooding problem. See `docs/principles/undo-discipline.md` and the
experiment spec at `experiments/01-undo-flood-reproducer/`.

## 13. Minimum viable memory

If you memorize nothing else, memorize:

- `live_set` is the Song root.
- `live_set view selected_track` is how you find the user's focus.
- Mixer params like `volume` are **DeviceParameter children** of `mixer_device`,
  not path segments.
- `getcount("children_name")` before iterating.
- `api.id == 0` means the path did not resolve — guard for it.
- Observers cannot be unregistered in JS; reuse or repoint via `.path`.
- Do not write to Live from inside an observer callback — defer it.
- `live.thisdevice` banging is the signal that LiveAPI is safe to use.
- `live_set tracks N devices M parameters P` is the canonical parameter path.

## 14. Further reading

- `docs/reference/lom/*.yaml` — precise per-object field lists.
- `docs/reference/liveapi-js-notes.md` — deeper JS-specific patterns.
- `docs/reference/threading-and-deferral.md` — what can run where.
- Live API Overview: https://docs.cycling74.com/userguide/m4l/live_api/
- LOM reference (current, 12.3.5): https://docs.cycling74.com/apiref/lom/
- LOM reference (Max 8, 12.1 — matches our target):
  https://docs.cycling74.com/legacy/max8/vignettes/live_object_model
