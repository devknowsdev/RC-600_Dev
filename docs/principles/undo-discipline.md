---
id: principle-undo-discipline
title: Undo discipline and internal modulation
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: medium
last_verified: 2026-04-16
related: [principle-max-for-live, ref-automation-vs-modulation, exp-01-undo-flood-reproducer]
---

# Undo discipline

A Max for Live device that pollutes Live's undo history is visible to the
user even when everything else works perfectly. Every time they press
Cmd-Z / Ctrl-Z to undo a real edit, they instead step back through a
thousand phantom "parameter changed" events from the device's internal
modulation. Their actual edit is now unrecoverable.

This is the most-cited UX failure in community discussion of M4L devices,
and the easiest to create by accident.

---

## What creates undo entries

Writing to a `DeviceParameter.value` via `[live.object]` or `LiveAPI.set()`
creates an undoable entry in Live's history. Every write. At whatever
rate you write them.

What does **not** create undo entries:

- Sending to a parameter via `[live.remote~]`.
- Observer-fired reads.
- `get value` operations.
- Audio-signal operations that don't touch `[live.object]` / `LiveAPI`.

## The flood pattern

Classic case:

```
[phasor~ 2]  ← 2 Hz LFO
     |
  [snapshot~]
     |
[live.numbox]  ← an exposed dial the user sees
     |
[live.object]
     |
[set value $1]  ← fires every snapshot tick
```

At 44.1 kHz snapshot rate, this creates ~44,100 undo entries per second.
Live's undo is effectively destroyed.

Even at 60 Hz (a visible UI refresh rate), 60 undo entries per second
means ~3600 per minute of playback. Still destructive.

## The two correct patterns

### Pattern A: use `[live.remote~]` for internal modulation

`[live.remote~]` writes the parameter value without creating undo
entries. It's designed for audio-rate modulation:

```
[phasor~ 2]
     |
[live.remote~]  ← takes parameter id on its right inlet
```

The right inlet takes a parameter id (obtained via `[live.path]` + 
`[live.object]`) and streams the signal-rate value directly to Live's
parameter engine. No undo, no persistence of intermediate values.

When the `[live.remote~]` stops sending, the parameter keeps the **last
value written**. Be aware: that last value does persist on save unless
you reset it.

### Pattern B: don't expose internally-driven controls at all

If the user should never see or automate the dial because it's internal
machinery, don't give it a `[live.*]` UI with exposed status. Options:

- Hide the parameter (`Parameter Visibility` = Hidden in the inspector).
  The DSP still reacts; the user doesn't see it in automation / mapping.
- Use a non-`[live.*]` object (`[dial]`, plain `[number]`) — but then it
  won't save with the set at all, which has other consequences.
- Keep it purely in the patch's signal world (`[number~]`, `[scope~]`, 
  internal `[pattrstorage]`) without any Live binding.

## The nuance: what about user-triggered writes?

When the user turns a dial, Live itself handles that as an undoable
event. Your device should NOT also write the value back. A common
mistake:

```
[live.numbox] → [live.object] (set value $1)
```

This is redundant and creates double-undo entries. The `[live.numbox]`
is already writing to the parameter — that's what the object does. The
extra `[live.object]` set is pure noise.

The correct pattern for a user-facing dial that feeds DSP is:

```
[live.numbox]  ← user interaction, Live handles undo
     |
   [signal~]   ← feeds audio
     |
   [*~ input]
```

No `[live.object]` involved on that path.

## Observer-side undo concerns

Observer callbacks can tempt you to write back to Live in response to a
change. Besides being disallowed from inside a notification (see
`ref-threading-and-deferral`), such deferred writes still create undo
entries if they go through `[live.object]` set. If your device responds
to a user action by rewriting other parameters, each rewrite is an
undo entry. A "smart" device that auto-adjusts eight other knobs when
one is turned may cause 8 undo entries per user action — which is
confusing even when each is "correct."

Either:

- Batch into a single user-visible undo entry (Live's own behavior for
  some compound operations).
- Use `[live.remote~]` to drive the others if they are genuinely
  internal.
- Don't do it — question whether auto-adjusting is good UX.

## What about DSP parameters vs Live parameters?

Parameters inside Max that aren't exposed to Live (plain `[dial]`,
`[number]`, `[pattr]`-managed but not `[live.*]`) don't create Live
undo entries because Live doesn't know about them. They may create Max's
own internal undo entries — usually not a problem.

## Testing for undo pollution

See `experiments/01-undo-flood-reproducer/` for a reproducible test. Short
version: open a set with the device, do 10 meaningful edits (rename a
track, move a clip, adjust a mixer fader, etc.), then press undo. Count
how many undos it takes to reach a state before those edits. If the
number is >10 by any significant margin, something in your device is
writing to Live's state internally.

## What remains uncertain

- The exact rate at which `[live.remote~]` writes are processed
  internally (likely audio rate, but buffer-size-dependent).
- Whether rapid parameter reads via `[live.observer]` can themselves
  cause any internal churn.
- Whether certain parameter types (is_quantized enums) coalesce
  repeated identical writes or create one entry per write regardless.

All would benefit from experiment.

## The one-line rule

**If your device writes to `[live.object]` set at more than 1 Hz, stop
and rethink.** There is almost always a `[live.remote~]`, visibility
change, or architectural rewrite that's correct.
