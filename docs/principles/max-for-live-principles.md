---
id: principle-max-for-live
title: Max for Live development principles
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: official
confidence: high
source: "Ableton Max for Live Production Guidelines (Ableton developer portal)"
last_verified: 2026-04-16
related: [principle-parameter-identity, principle-undo-discipline, principle-observer-architecture, principle-release-discipline]
---

# Max for Live development principles

This is our normative standard for building Max for Live devices that are
safe to ship. It replaces `max-for-live-development-principles.md` from the
previous repo. Content is condensed and every principle includes a concrete
example of what going wrong looks like.

A good M4L device is not a patch that works. It is a well-behaved Live
device.

---

## 1. Use `[live.*]` UI objects for anything Live-facing

If a control is supposed to behave like a native Live parameter — be
automatable, mappable to MIDI/keys, recalled on set load, shown on Push —
use a `[live.*]` UI object. The set is: `live.dial`, `live.numbox`,
`live.toggle`, `live.slider`, `live.menu`, `live.tab`, `live.button`,
`live.text`.

**What breaks if you don't:** A non-`[live.*]` dial looks fine in the
device, but will not appear in the automation chooser, cannot be mapped to
a MIDI knob, and is not stored with the Live Set — so its position resets
every time the user reopens their set. Users report this as "my device
keeps losing settings."

## 2. Parameter names are part of the product

For every exposed parameter, set the **Short Name** (what fits on Push
and in compact displays) and the **Long Name** (what appears in the
automation lane chooser). Pick them deliberately, before the device ships.

**What breaks if you don't:** Default names like "live.dial[3]" in the
automation lane. Users can't tell what they automated. Worse, when you
later rename the parameter, Live's parameter identity may or may not
carry forward depending on what else changed — see
`principle-parameter-identity.md`. Shipping with generic names is not
neutral; it is a compatibility trap for future-you.

## 3. Long Names are compatibility contracts

Once a Long Name is shipped in a user's Live Set, changing it risks
breaking that user's automation and mapping. Treat Long Names the way you'd
treat a public function signature.

See `principle-parameter-identity.md` for the full discipline around
parameter migration.

## 4. Do not drive visible parameters for internal modulation

If your device needs an LFO inside it, do not animate an exposed
`[live.dial]` via `[live.object]` at audio rate. This floods undo history
and makes Live's undo feature unusable for the user.

Use one of:

- `[live.remote~]` for audio-rate modulation that writes without creating
  undo entries or persisting state.
- A hidden internal signal path that does not touch a Live-stored parameter
  at all.
- A visible parameter marked **Hidden** in the `Parameter Visibility` menu
  of the `[live.*]` object's inspector — it still exists for the DSP but
  is not stored or automatable.

See `principle-undo-discipline.md`.

## 5. Deterministic initialization

At device load time, the order in which parts of your patch wake up is
not guaranteed by wall-clock timing. Do not use `[delay 10]` to "wait
for things to settle" — wait for `[live.thisdevice]` to bang, then use
`[trigger]` to order your initialization.

```
[live.thisdevice]
     |
  [t b b b]       ← fan out in known order
   | | |
   | | [init step 3]
   | [init step 2]
   [init step 1]
```

**What breaks if you don't:** On slow machines or large sets, the device
initializes inconsistently — sometimes the parameter observers attach
before the parameters exist, sometimes after. The resulting bugs are
intermittent and hard to reproduce.

## 6. Assume multiple instances

A user may drop ten copies of your device into one set. Things that leak
between instances:

- Named `[send]` / `[receive]` pairs without a `---` prefix scope them
  globally. Two instances stomp on each other.
- Named `[buffer~]`, `[coll]`, `[table]` with non-scoped names.
- Any persistent state stored in a file or a `[dict]` that's globally
  named.

The rule: any named communication inside the device uses a local scope
prefix (Max's `---` convention), unless it is specifically intended to
be shared across all instances of this device type.

**What breaks if you don't:** Users report "when I have two of these in
the same set, they fight each other." Hours to diagnose.

## 7. Freeze before distributing

Live's **Freeze Device** operation bundles the device's dependencies (JS
files, sub-patches, images, `[buffer~]` audio files) into the `.amxd`
itself. Without freezing, the device works on your machine (where those
files exist at specific paths) and fails on the user's.

**Working rule:** Develop from unfrozen source. Distribute frozen. Keep
both: unfrozen source in git, frozen as the release artifact.

See `principle-release-discipline.md`.

## 8. Test save and reload

Every exposed parameter should be verified to recall correctly after:

- Save and reopen.
- Save on machine A, open on machine B.
- Duplicate the device within the same set.
- Copy the device to a different set.

A device that sounds right but loses state on reload is not releasable.
This is the single most common ship-stopper for new M4L developers.

## 9. Test with automation and undo active

Record some automation onto an exposed parameter. Play it back. Verify:

- The parameter moves correctly during playback.
- The `automation_state` reflects the right value (0/1/2).
- Manual overriding works as expected (parameter goes to state 2).
- `Re-enable Automation` restores playback control.
- Undo actually undoes what the user expects, not an internal event storm.

## 10. Test on Push if you intend Push support

Push's display strip and encoders apply the device's parameter banking.
Bank ordering, short names, and enum value labels behave specifically on
Push. There is no substitute for running the device on actual Push
hardware (or Push 3 Standalone) during development.

See `docs/reference/push-integration.md`.

## 11. Watch the Max Window for noise

A device that prints warnings or errors on load, on save, or during
normal operation is training the user to ignore the Max Window — which
then costs them later when something real happens. Treat console noise
like compiler warnings: fix them, don't tolerate them.

## 12. Keep the source patcher readable

Assume someone other than you will open the device's source in Max at
some point — a user who licensed the source, a future maintainer, a
collaborator, or you three years from now. Encapsulate into sub-patchers,
comment non-obvious routing, and lay out the patch so signal flow reads
top-to-bottom or left-to-right consistently.

## 13. Use Presentation mode intentionally

The device's "front face" in Live is its Presentation mode. Patching
mode is for the author. Lay out Presentation mode explicitly: pick a
fixed width, align controls to whole pixels, pick a color scheme that
reads in both light and dark Live themes.

**What breaks if you don't:** The device appears with random-looking
control placement, or clips weirdly at a specific Live theme, or
changes size depending on which encoder was last touched.

---

## The pre-release check

Before any M4L device is considered releasable, the release dossier
(see `templates/device-release-dossier.md`) should be filled in. Summary
of what it verifies:

1. Parameter identity unchanged from previous release (or migration path
   documented).
2. Save / reload works. Duplication works. Cross-machine open works.
3. Automation and undo behave.
4. No console noise.
5. Frozen artifact exists and is separately tested.
6. CPU behavior at typical use and multi-instance use is acceptable.
7. Push display is correct (if Push support is claimed).
8. Cross-platform test done (macOS + Windows) where feasible.

If these aren't checked, "done" means "it works on my laptop", which is
not done.
