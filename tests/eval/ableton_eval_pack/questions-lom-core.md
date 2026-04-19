# LOM Core Eval Set 01

Purpose: evaluate whether an assistant can answer practical Ableton Live API questions using the repo’s LOM layer without hallucinating structure, paths, or behavior.

Scoring per question:
- 2 = correct, grounded, and appropriately qualified
- 1 = partly correct but missing an important caveat or path detail
- 0 = wrong, hallucinated, or unsafe/confidently misleading

General fail conditions:
- invents non-existent properties/functions
- confuses Track properties with MixerDevice DeviceParameter children
- fails to guard for `id == 0`
- assumes list lengths without `getcount()`
- presents behavioral inference as guaranteed official fact

## Q1
How do you get the selected device on the currently selected track?

Expected points:
- distinguishes Song.View selection from Track.View selection
- uses `live_set view selected_track`
- then reaches the selected device through the track’s `view selected_device`
- mentions `id == 0` guard if no selected track or no selected device

Strong answer shape:
- `live_set view selected_track`
- then `... view selected_device`

## Q2
A user wants the track volume of track 3. Should they read `Track.volume`?

Expected points:
- says no
- explains volume is a `DeviceParameter` child of `MixerDevice`
- gives path pattern like `live_set tracks 2 mixer_device volume`
- may mention pan, sends, activator follow same pattern

## Q3
How should an assistant safely inspect all devices on a track?

Expected points:
- uses `getcount("devices")`
- iterates `live_set tracks N devices M`
- does not assume a fixed number
- may mention mixer device handling if relevant

## Q4
What is `this_device` for, and when is it better than locating a device by track index?

Expected points:
- identifies `this_device` as the current Max for Live device
- explains it avoids brittle position-based lookup
- notes it resolves to the device’s own LOM instance
- may mention it is essential for self-relative utilities

## Q5
What is the difference between `Track.View.selected_device` and `Song.View.selected_parameter`?

Expected points:
- distinguishes per-track selected device from global selected parameter
- does not collapse them into the same concept
- notes selection context matters

## Q6
How do you inspect what is loaded on Drum Rack pad 36?

Expected points:
- uses drum pad pathing
- reaches pad chains, then devices
- example like `live_set tracks N devices M drum_pads 36 chains 0 devices 0`
- mentions checking chain count first

## Q7
What is the type of `DeviceParameter.display_value` and why does it matter?

Expected points:
- says GUI/display-facing value, string/symbol-like rather than numeric float
- explains difference from internal numeric `value`
- mentions this matters for UI/export/user-facing answers

## Q8
How do you tell whether a ClipSlot is empty before reading its clip?

Expected points:
- use `has_clip` or guard `clip.id == 0`
- does not assume `clip` always exists
- understands empty slot semantics

## Q9
What is the difference between a Chain’s `devices` list and its `mixer_device` child?

Expected points:
- says chain processing devices are in `devices`
- says chain-local mixer is a separate named child
- explicitly states mixer is not part of `devices` list

## Q10
An assistant wants to branch behavior by Live version. What object/path should it use?

Expected points:
- use `live_app`
- call version getters on Application
- does not try to infer version from device names or Song state

## Q11
What is risky about relying on exact integer mappings for properties like quantization or automation state?

Expected points:
- says enum mappings are high hallucination-risk
- says exact mappings should be verified against official docs/current version
- distinguishes structure from exact numeric semantics

## Q12
How should a good answer describe Clip loop markers and units?

Expected points:
- mentions unit differences can depend on clip/audio state
- does not overstate without qualification
- notes loop/marker semantics differ across warped/unwarped audio and MIDI contexts

## Rubric notes

A high-quality answer set should:
- prefer canonical paths
- mention `id == 0` when relevant
- separate official structure from runtime behavior
- use cautious wording for enum mappings and UI-derived behavior
- avoid inventing unsupported methods or children

## Suggested threshold

- 20–24: strong grounding
- 15–19: useful but still error-prone
- 10–14: weak operational reliability
- <10: not ready for copilot use
