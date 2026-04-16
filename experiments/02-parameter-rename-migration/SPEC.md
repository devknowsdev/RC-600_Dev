---
id: exp-02-parameter-rename-migration
title: "Experiment 02: Parameter rename impact on Live Set recall"
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: open
confidence: low
last_verified: 2026-04-16
related: [principle-parameter-identity]
---

# Experiment 02: Parameter rename impact on Live Set recall

## Hypothesis

Changing a Max for Live device's exposed parameter **Long Name** between
releases breaks, in a saved Live Set that uses the previous version:

- automation lanes keyed to that parameter,
- MIDI mappings to that parameter,
- macro mappings when the device is inside a Rack.

Changing the **Short Name** (without changing Long Name) breaks none of
these. Reordering parameters (without changing names) breaks none of
these but may break Push bank layout.

## Why this matters

Upgrades `principle-parameter-identity` from `evidence: inference` to
`evidence: experiment`. Produces a concrete, cited reference for what
kinds of parameter change are safe vs breaking.

## Target environment

- Live: 12.1 (or the specific version being verified)
- Max: 8.6
- OS: record which

## Setup

Build a reference device `assets/param-v1.amxd`:

- Max for Live Audio Effect.
- Four exposed parameters via `[live.dial]`:
  - "Cutoff Frequency" (Long) / "Cutoff" (Short), 20–20000 Hz.
  - "Resonance" / "Res", 0–1.
  - "Filter Type" / "Type", quantized enum {Lowpass, Highpass, Bandpass}.
  - "Output Gain" / "Gain", -24 to +24 dB.
- Each dial drives a trivial DSP (this is not a DSP test — any
  filtering will do; the point is to have parameters that are visible
  and settable).

Build three derived devices:

- `assets/param-v2-rename-long.amxd`: identical except "Cutoff
  Frequency" becomes "Filter Cutoff" in Long Name.
- `assets/param-v2-rename-short.amxd`: identical except "Cutoff" becomes
  "Freq" in Short Name.
- `assets/param-v2-reorder.amxd`: identical parameters, but parameter
  order in the bank is {Resonance, Cutoff Frequency, Output Gain, Filter
  Type}.

Create a reference Live Set `assets/starter.als`:

- One MIDI track with `param-v1` loaded.
- Cutoff Frequency automated: a lane with breakpoints going 100 Hz →
  5000 Hz → 100 Hz over 4 bars.
- Cutoff Frequency MIDI-mapped to MIDI CC 74.
- A Rack containing the device, with Macro 1 mapped to Cutoff Frequency.

## Method

1. Open `starter.als`. Verify automation plays correctly: cutoff sweeps
   during the 4 bars. Verify CC 74 moves the dial. Verify Macro 1
   moves the dial.
2. Save-as `results/baseline.als`. Close the set.
3. **Test A: long-name rename.** Replace `param-v1.amxd` in the set's
   device chain with `param-v2-rename-long.amxd`. The substitution
   method:
   - Open the set.
   - Right-click the device → Save Device State as Default (to
     preserve any user-edited values, if desired).
   - Delete the device.
   - Drag in `param-v2-rename-long.amxd`.
   - Inspect: is the automation lane still present? Does it still
     target "Cutoff Frequency" (now missing) or "Filter Cutoff"
     (new name)?
   - Play the set. Does cutoff automate?
   - Turn MIDI CC 74. Does it move anything?
   - Turn Macro 1. Does it move anything?
   - Save as `results/test-A-rename-long.als`.
4. **Test B: short-name rename.** Same method with
   `param-v2-rename-short.amxd`. Save as `results/test-B-rename-short.als`.
5. **Test C: reorder.** Same method with `param-v2-reorder.amxd`. Save
   as `results/test-C-reorder.als`.
6. Each test: take a screenshot of the automation lane state
   (populated/empty, target name shown) and the mapping chooser.
   Save to `results/screenshots/`.

## Measurement

For each test variant, record in a table in `results/RUNLOG.md`:

| Binding | Preserved? | Notes |
| --- | --- | --- |
| Automation lane | yes / orphan / empty | exact behavior |
| MIDI CC 74 mapping | yes / no | |
| Macro 1 mapping | yes / no | |
| Push bank (if Push available) | ordered as v1 / new order | |

## Expected outcomes

Primary hypothesis:

- Test A (Long Name change) — all three bindings break or orphan.
- Test B (Short Name change) — all three bindings preserve.
- Test C (reorder) — all bindings preserve; Push order changes.

Alternative outcomes:

- Live has a fuzzy-match / heuristic for parameter re-binding on
  Long-Name change, and some bindings actually survive — would be
  significant because it would soften the "never change Long Names"
  rule.
- Short Name changes break something unexpected (they shouldn't, but
  worth verifying).
- Reorder actually breaks automation in a subtle way — possible if
  Live's internal matching uses index as a tiebreaker.

## Results

`results/` is empty until run. Run across macOS and Windows if
possible — the matching logic should be platform-independent, but worth
confirming.

## Cleanup

Clear any MIDI mappings learned during the test so they don't carry
over between runs.

## Variants to consider later

- Parameter type change: enum → continuous (hypothesis: breaks).
- Parameter min/max change that leaves stored values in range vs out.
- Rename Long Name AND reorder simultaneously — does Live still match
  by the old position?
- Clip envelope (modulation) bindings vs automation lane bindings — do
  they behave identically under rename?
