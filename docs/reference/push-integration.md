---
id: ref-push-integration
title: Push integration for Max for Live devices
surface: push
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: low
last_verified: 2026-04-16
related: [ref-lom-device, ref-lom-deviceparameter, principle-parameter-identity]
---

# Push integration for Max for Live devices

Push 2 and Push 3 (Standalone and MPE) surface Max for Live devices through
Live's standard device-display machinery. A well-designed M4L device gets
Push support mostly for free; a carelessly-designed one fails in specific,
diagnosable ways.

This note is a starting-point. It is `evidence: inference` because the
specific display-string and banking rules are partially observed, partially
documented across scattered sources, and we have not yet run systematic
Push-targeted experiments in this repo.

## What Push actually displays

When a user navigates to a Max for Live device on Push, the display shows
the device's **banked parameters** — typically 8 per bank — with their
names, current values, and a rotary-encoder-assignable row.

The mapping is:

- **Parameter banks** are defined in the M4L device's patcher via the
  device's **Parameter Order / banks** configuration.
- Each bank has a name and 8 parameter slots.
- Push reads the banks and lays them out on the encoders and display strip.

The **Short Name** of a parameter (set in `[live.numbox]` and similar
`[live.*]` UI objects) is what fits on Push's small character cells. If it
doesn't fit, Push truncates. Truncation isn't a bug — it's a design signal
to pick shorter Short Names.

## The critical device UX rules for Push

1. **Set your Short Names intentionally.** Push displays Short Name; Live
   automation displays Long Name. Both matter, for different reasons.
2. **Order your parameter banks.** If you have more than 8 exposed
   parameters, define bank ordering explicitly — don't rely on patcher
   order defaults.
3. **Group related parameters in the same bank.** Push encoders are
   spatial; users learn muscle memory. Breaking a coherent parameter set
   across two banks makes it unlearnable.
4. **Prefer `[live.*]` UI objects for anything Push-facing.** Non-`[live.*]`
   controls may display differently or not at all.
5. **Test on Push.** There is no substitute. Behavior around enum
   parameters, display formatting, and banking can surprise you.

## Device color theme and display

Push 2 has a color display; Push 3 Standalone has the same. M4L devices can
influence their display strip's color and presentation via the **device
color** set in the inspector. This doesn't affect the device's chain-color
in Live's UI, which is separate.

## Parameter-type display behavior

| Parameter type | Push encoder behavior | Notes |
| --- | --- | --- |
| Continuous float/int (`live.dial`, `live.numbox`) | Smooth encoder turn | Shows numeric value |
| Quantized enum (`live.menu`, `live.tab`) | Stepped encoder, each click = one enum | Shows `value_items[i]` text |
| Boolean toggle (`live.toggle`) | Encoder click or button press | Shows on/off |
| Text (non-`[live.*]` `comment`, etc.) | Not banked | Not present on Push |

## Performance Impact (`performance_impact`)

`Track.performance_impact` is surfaced on Push 3 Standalone as a CPU meter.
A device that spikes `performance_impact` will be visible to the user there.
If you're shipping a device that's expected to run on Push 3 Standalone,
test with Push 3's actual audio engine — its CPU budget is lower than a
desktop.

## Push 3 Standalone specifics

Push 3 Standalone runs a Live engine natively. M4L devices run on it. The
implications we've noted (inference — verify before relying):

- CPU budget is lower than a typical desktop host.
- The Live version on Standalone may lag desktop Live releases by days to
  weeks at launch. Test against the actual Standalone firmware.
- The sample rate is fixed in standalone mode (historically 48 kHz).
  Devices that assume 44.1 may drift or behave unexpectedly.
- Not all VST/AU plug-ins are available; M4L and native Live devices have
  broader coverage. This makes M4L devices disproportionately important on
  Push 3 Standalone.

## MPE support

Push 3 has MPE-capable pads. M4L MIDI effects and instruments can produce
or consume MPE. Live 11+ introduced MPE lanes. For devices targeting
expressive performance:

- If your device processes incoming MIDI, decide whether it should be
  **MPE-transparent** (pass through MPE) or **MPE-aware** (interpret
  per-note expression).
- The `[midiin]` / `[midiout]` objects work at the MIDI level and see
  MPE messages as standard MIDI with per-channel note data.
- For higher-level access, the Clip LOM object exposes per-note
  MPE data via the extended notes API (`get_notes_extended` and friends,
  Live 11+).

## What's missing from this note

- A worked example of banking — the minimal M4L patch that banks 16
  parameters across 2 named banks, verified on Push.
- A Push-tested device in `examples/m4l/` demonstrating good defaults.
- The exact behavior of parameter names with multi-byte characters on
  Push display.
- Behavior on Push 1 (legacy, still in use by some users).

## Experiment candidates

- **Bank layout fidelity.** Build a device with 24 parameters across 3
  banks. Verify bank names, parameter ordering, and truncation behavior
  on Push 2 and Push 3.
- **Short Name character limits.** Empirically find the column width on
  Push 2 vs Push 3's main display for parameter labels.
- **CPU budget comparison.** Run the same DSP-heavy M4L device on
  desktop Live and Push 3 Standalone; compare `performance_impact`.

## References

- Ableton Push User Manual (for users):
  https://www.ableton.com/en/manual/push/
- Ableton Max for Live Production Guidelines (see `reference/README.md`) —
  the Push section.
- Cycling '74's `live.*` object reference, specifically `[live.dial]`,
  `[live.numbox]`, `[live.menu]`, `[live.tab]` for the banking
  infrastructure.
