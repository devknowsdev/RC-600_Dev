---
id: exp-01-undo-flood-reproducer
title: "Experiment 01: Reproduce undo flooding from internal modulation"
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: open
confidence: low
last_verified: 2026-04-16
related: [principle-undo-discipline, ref-automation-vs-modulation]
---

# Experiment 01: Reproduce undo flooding from internal modulation

## Hypothesis

A Max for Live device that writes to an exposed `[live.*]` parameter via
`[live.object]` at high rate (>= 60 Hz) will generate one undo entry per
write, flooding Live's undo history. The same modulation implemented via
`[live.remote~]` will not generate any undo entries.

## Why this matters

Upgrades `principle-undo-discipline` from `evidence: inference` to
`evidence: experiment`. Establishes the exact failure mode so future
devices in this repo can be tested against a known-bad baseline.

## Target environment

- Live version: 12.1 (or the target's current stable)
- Max version: 8.6
- OS: macOS or Windows (document which)

## Setup

Build two tiny M4L Audio Effect devices and place them in a folder in
`assets/`:

**Device A: `flood-via-live-object.amxd`**

Patch contents (described for building in Max):

- `[live.thisdevice]` → triggers init
- `[metro 16]` (~60 Hz) → `[live.object] set value <x>` into an exposed
  `[live.numbox]` with Long Name "Flood Dial"
- `[live.numbox]` is wired to a sine oscillator or no audio (doesn't
  matter for the test)

**Device B: `remote-modulation.amxd`**

- `[phasor~ 4]` → `[live.remote~]` whose right inlet receives the id of
  the exposed `[live.numbox]` "Remote Dial"
- The user-visible dial animates at audio rate.

Create a reference Live Set `assets/starter.als`:

- One audio track with Device A on it.
- One audio track with Device B on it.
- A few tracks with nothing special (so there's undoable state).

## Method

1. Open `starter.als`. Verify both devices are loaded and their dials
   are at their default positions.
2. **Control phase — do not touch the devices.** Make 5 deliberate
   edits (rename a track, change a mixer fader, move a clip, etc.).
3. Press undo 5 times. Verify the 5 edits are reversed and Live
   reports "nothing to undo" after the 5th press.
4. **Device A flood phase.** Enable `[metro]` in Device A (right-click
   to enable the flood). Let it run for 10 seconds.
5. Disable the flood. Now press undo. Count how many presses it takes
   to revert any user-visible state change (expect: many, unrelated
   to your edits).
6. Close the set without saving. Reopen.
7. **Control phase 2 — do not touch the devices.** Make 5 deliberate
   edits again.
8. **Device B phase.** Enable `[phasor~]` in Device B. Verify the dial
   animates. Let it run for 10 seconds.
9. Disable. Press undo. Count: how many presses to reach the state
   before your 5 edits? Expect: 5.

## Measurement

- **Signal:** the effective undo depth consumed by each phase.
- **Instrument:** count of Cmd-Z / Ctrl-Z presses and the state
  observed after each press.
- **Recording:**
  - `results/RUNLOG.md` with a table (phase, press count, observed
    state).
  - `results/console.log` — output of Max Window if anything posts.
  - `results/starter-after-flood.als` — saved copy of the set
    immediately after phase 5, before closing.

## Expected outcomes

Primary: Device A's flood phase generates hundreds-to-thousands of undo
entries; Device B's phase generates zero.

Alternative outcomes:

- **Device A generates fewer entries than expected** — Live may be
  coalescing rapid identical writes. Worth investigating the
  coalescing rule. Note in RUNLOG and follow up.
- **Device B generates some undo entries** — unexpected. Could indicate
  a Live bug, a Max version difference, or that `[live.remote~]` does
  in fact register state changes in some cases. Note carefully.
- **Device A produces no user-visible state change to undo** — possible
  if the parameter reaches steady state. The undo history still has
  entries; they just don't change anything visible. Count via Live's
  History panel if available.

## Results

See `results/RUNLOG.md` once run. Currently empty.

## Cleanup

Delete the test devices from the reference set if you don't want them
persisting. The experiment is destructive to undo history of the test
set only.

## Variants to consider later

- Rate sensitivity: at what `[metro]` rate does the flood become
  noticeable? 1 Hz? 10 Hz? 100 Hz?
- Does enabling the `[metro]` only during playback (vs always) change
  behavior?
- Does a `[live.*]` object marked Hidden in parameter visibility still
  generate undo when driven via `[live.object]`?
- Cross-instance: two instances of Device A simultaneously — do their
  undo entries interleave, or does Live serialize?
