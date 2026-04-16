---
id: ref-midi-tools-api
title: MIDI Tools API — primer
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: low
available_since: "12.0"
last_verified: 2026-04-16
related: [ref-lom-clip]
---

# MIDI Tools API

Live 12 introduced **MIDI Tools** as a surface for algorithmic and
generative transformation of MIDI content inside clips. A MIDI Tool is a
Max for Live device of a new type that Live routes selected notes through
when the user invokes "Apply" from the clip detail view.

This note is `confidence: low` because the MIDI Tools API surface is
relatively recent, its documentation is still maturing, and we have not
yet built and shipped a MIDI Tool in this repo.

## What a MIDI Tool is

- A special Max for Live device type, alongside instrument / audio-effect /
  MIDI-effect. Authored in Max with M4L.
- Not part of a track's signal chain. Invoked **on demand** by the user,
  taking the currently selected notes as input and producing transformed
  notes as output.
- Exposes parameters that adjust the transformation (strength, mode,
  randomness, etc.).

Examples shipped by Ableton include Rhythm, Seed, Shape, Stacks, and others
across the 12.x releases.

## Surface the author works against

A MIDI Tool receives a list of notes (the selection) and parameters (the
tool's exposed knobs), and produces an output list of notes. The note
representation uses Live 11's extended MIDI API — notes with per-note ids,
pitch, start time, duration, velocity, and release velocity (for MPE-aware
work, also per-note expression data).

The transformation is **pure**: input notes + parameters → output notes.
The tool does not schedule notes over time; it computes the whole result
and Live applies it.

## Key design concerns specific to MIDI Tools

**Determinism.** A tool that randomizes should expose a seed parameter.
Undoable user actions that invoke the tool should re-apply with the same
result when the user undoes and redoes.

**Idempotence and composability.** Consider what happens when the user
applies the tool twice. Some tools (quantize) are idempotent; others
(randomize) are not. Document the expected behavior.

**Parameter identity.** Same rules as other M4L devices — parameter names
matter for user mapping and for preset recall. A shipped MIDI Tool whose
parameter names shift breaks user presets.

**Scale awareness.** Live 12 has a global scale concept. Tools that
quantize pitch should use the scale where appropriate:

    live_set scale_name
    live_set scale_mode
    live_set root_note
    live_set scale_intervals

A tool that quantizes to the scale gets the current scale from these
properties.

## What's missing from this note

- The exact M4L device type identifier for MIDI Tools (as seen in
  `Device.class_name`).
- The canonical patcher scaffolding — the specific `[live.*]` objects and
  message flow for a minimum-viable MIDI Tool.
- Documented examples of Ableton's own MIDI Tools with their parameter
  layouts as references.

## Experiment candidate

Build a trivial MIDI Tool (e.g. "transpose all selected notes up one
semitone"). Record the M4L project structure, the device type, the message
flow, the invocation mechanism. That single worked example would raise
this note's confidence from low to medium.

## References

- Ableton's Live 12 release notes for MIDI Tools introduction.
- Ableton's Learn page on MIDI Tools (search current Ableton Help).
- Cycling '74's Max for Live documentation for the tool authoring API
  (search current Cycling '74 docs — coverage is still sparse).
