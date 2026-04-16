# Decisions — Selected Track Inspector

## D1: Use `[js]` not patch-only

**Decision:** Core logic in JavaScript, not pure Max patching.

**Reason:** Observer rebinding (watch selected_track → rebind lower
observers) is cleaner in JS than in a patch. This example should
demonstrate the recommended JS observer pattern from
`docs/principles/observer-architecture.md`.

## D2: Audio Effect type, not MIDI Effect or Instrument

**Decision:** Build as an Audio Effect.

**Reason:** Audio Effects can be placed on any track type (audio, MIDI,
return, master). MIDI Effects can only go on MIDI tracks. Since this
device doesn't process audio or MIDI, either would technically work, but
Audio Effect maximizes where it can be instantiated.

## D3: Reuse observers, don't create new ones

**Decision:** Create all `LiveAPI` observer instances in `init()`. On
selection change, repoint via `.id`, never `new LiveAPI(...)`.

**Reason:** JS LiveAPI observers cannot be unregistered. The naive
pattern (new observer per selection change) leaks. This device should
demonstrate the correct pattern, because it's the repo's first example.

## D4: No exposed parameters

**Decision:** The device has no user-facing `[live.*]` parameters.

**Reason:** It's a display-only diagnostic tool. Adding exposed
parameters would introduce recall, undo, and automation concerns that
are irrelevant to its purpose and would dilute the example's focus.

## D5: Guard all id == 0 cases

**Decision:** Every `LiveAPI` result is checked for `id == 0` before use.

**Reason:** Edge cases where selection is undefined (during track
deletion, at startup) must not crash the device. This is a teaching
example — it should be correct in the places that matter most.

## D6: Display via outlet to `[live.text]`, not `post()`

**Decision:** The device outputs display values to `[live.text]` objects
in Presentation mode, not to the Max console.

**Reason:** Users of the finished device can't see the Max console
(especially with frozen devices). A user-visible display inside the
device is the correct pattern for a utility tool.
