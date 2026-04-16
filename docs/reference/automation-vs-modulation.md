---
id: ref-automation-vs-modulation
title: Automation vs modulation in Live
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: medium
last_verified: 2026-04-16
related: [ref-lom-deviceparameter, principle-undo-discipline]
---

# Automation vs modulation

Live exposes three distinct ways a parameter's value can change over time,
and they behave differently in recall, undo, and LOM visibility. Conflating
them is a common mistake and was not addressed in the previous version of
this repo.

## The three mechanisms

**Automation.** Recorded or drawn value changes on a lane (Session clip
envelopes or Arrangement lanes). Automation sets the parameter's value.
Overriding a parameter during playback "overrides" its automation — a state
reflected in `DeviceParameter.automation_state`.

**Modulation.** Live 11 added modulation envelopes as a separate layer.
Modulation offsets the automated or static value without overwriting it.
Modulation envelopes live alongside automation lanes in clips but do not
touch the parameter's underlying value.

**Internal modulation via `[live.remote~]`.** In Max for Live devices, you
can drive a parameter at audio rate using `[live.remote~]`. This writes to
the parameter without creating automation, without being recorded, and —
crucially — **without generating undo entries**. It's the correct primitive
for device-internal envelopes, LFOs, and side-chain-style modulation.

## LOM visibility

| Mechanism | Visible in LOM? | Notes |
| --- | --- | --- |
| Automation | Via `automation_state` (0/1/2) per parameter | Edit via clip envelope API |
| Clip modulation envelope | Via clip envelope API | Treated as another envelope type |
| `[live.remote~]` | Not visible | The parameter just appears to move; `value` reads as the current effective value |

## Implications for device design

- If you are driving a parameter at high rate from inside a device, use
  `[live.remote~]` — **not** `set value` on `[live.object]`.
- `[live.remote~]` requires the parameter to be `is_enabled`. It won't touch
  disabled or macro-controlled parameters.
- A parameter under `[live.remote~]` control reports `is_enabled: 0` to other
  writers — they can't set it while you're modulating. This is by design.
- Automation and modulation are stored with the clip, not the device.
  Changing a device version doesn't invalidate a clip's automation lane —
  but it can if the targeted parameter's identity changes. See
  `docs/principles/parameter-identity.md`.

## Implications for tools

- When reading "the current value of a parameter" while the user is playing,
  you get the effective value — which may include automation and modulation
  offsets. If you need the automation-target value vs the live effective
  value vs the user's manual override, you often need to check
  `automation_state` and derive.
- To read what the user has done manually vs what automation is doing,
  `automation_state == 2` means "automation overridden" — the user has
  grabbed the control and the displayed value is their manual one.

## What remains uncertain

- The exact ordering in which modulation offsets, automation values, and
  `[live.remote~]` outputs are summed into the final effective value. This
  almost certainly depends on parameter type and is version-sensitive.
  Would benefit from an experiment. Downgrade any claim about this to
  `evidence: inference` until run.
- Whether modulation envelopes written via the API behave identically to
  user-drawn ones in all edge cases (recording, freeze/render, etc.). Needs
  an experiment.
- Whether `[live.remote~]` writes survive rapid device enable/disable
  cycles cleanly.

## Sources and further reading

- DeviceParameter LOM page: https://docs.cycling74.com/apiref/lom/deviceparameter/
- Ableton's Max for Live Production Guidelines (see `reference/README.md`)
  for the recommended modulation patterns.
- Live 11 release notes for the modulation-envelope feature introduction.

## Intentionally flagged open questions

Written as `evidence: inference` because while the three-mechanism model is
clearly right, the precise summation order and the exact LOM coverage of
modulation envelopes is not pinned down in a single cited source here.
Upgrading to `evidence: official` requires finding the Ableton reference doc
section that describes this or running a summation-order experiment.
