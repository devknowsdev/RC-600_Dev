---
id: curriculum-main
title: Ableton expert curriculum
surface: meta
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: high
last_verified: 2026-04-16
related: [meta-methodology]
---

# Ableton expert curriculum

Staged learning path across the surfaces in scope. For each stage: the
objective, the artifacts to read, what "mastery" means, and the failure
mode to avoid. Every file referenced exists in this repo — no phantom
paths.

---

## Stage 0: Orientation

**Objective.** Tell the surfaces apart.

**Read.** `docs/principles/max-for-live-principles.md` (the surface
definitions at the top); the surface enum in `docs/_meta/frontmatter-schema.md`
(m4l, liveapi, remote-script, plugin-host, link, push, packaging);
`docs/reference/remote-scripts-overview.md` for the controller-script
surface distinction.

**Mastery.** Given a one-line idea ("I want to build X"), route it to
the right surface: Max for Live, external plugin, Link app, remote
script, or MIDI tool. Explain why.

**Failure mode.** Treating "Ableton development" as one thing. Building
a VST when a Max for Live device was needed. Building a remote script
when a regular Max for Live device was right.

---

## Stage 1: Live as a host environment

**Objective.** Understand that Live is a host with conventions, not
just a DAW that happens to run plugins.

**Read.** `docs/principles/max-for-live-principles.md` (all sections),
`docs/reference/crash-recovery.md`.

**Mastery.** Explain why a technically-working device may still be a
bad Live device. Know where Log.txt lives on your OS.

**Failure mode.** Building patches that work in Max standalone but
misbehave in Live due to mixer, automation, or undo coupling.

---

## Stage 2: Live Object Model fluency

**Objective.** Move around the LOM without bluffing.

**Read.** `docs/reference/liveapi-cheatsheet.md`, then the LOM YAMLs in
`docs/reference/lom/` — at minimum: `song.yaml`, `track.yaml`,
`device.yaml`, `deviceparameter.yaml`, `mixerdevice.yaml`, `clipslot.yaml`,
`clip.yaml`, `scene.yaml`, `song-view.yaml`.

**Mastery.** Given an LOM task ("launch the scene the user has
highlighted", "mute all tracks whose name contains 'sfx'"), sketch the
path traversal and the operations. Know when a path walks through a
named child vs a list index. Correctly handle `id 0`.

**Failure mode.** Writing `live_set tracks 0 mixer_device volume` and
calling `get volume` on the mixer — rather than walking to the volume
DeviceParameter child and calling `get value`. This error was in the
previous version of this repo.

---

## Stage 3: LiveAPI in practice (JavaScript)

**Objective.** Build reliable LiveAPI tools.

**Read.** `docs/reference/liveapi-js-notes.md`,
`docs/reference/threading-and-deferral.md`,
`docs/principles/observer-architecture.md`.

**Mastery.** Write a multi-track selection-aware tool with correct
observer rebinding, no leaks under stress, no writes from inside
callbacks, and handling of id 0.

**Failure mode.** Creating a new `LiveAPI(callback)` on every selection
change. Undo-flooding from internal modulation via `[live.object]` at
audio rate (when `[live.remote~]` was the correct primitive).

---

## Stage 4: Max for Live device production

**Objective.** Build devices that are safe to ship.

**Read.** `docs/principles/max-for-live-principles.md` (all),
`docs/principles/parameter-identity.md`,
`docs/principles/undo-discipline.md`,
`docs/principles/release-discipline.md`,
`templates/device-release-dossier.md`.

**Mastery.** Take a prototype and turn it into a release artifact.
Produce a filled-in release dossier. Pass a parameter-identity audit
against the previous release.

**Failure mode.** Treating update as "the same patch but newer."
Shipping with parameter names that will need changing. Not testing
on the target platforms.

---

## Stage 5: Push and controller integration

**Objective.** Make devices work on Push; understand remote scripts.

**Read.** `docs/reference/push-integration.md`,
`docs/reference/remote-scripts-overview.md`,
`docs/reference/lom/controlsurface.yaml`.

**Mastery.** Know when to build as a Max for Live device with Push
banking vs as a remote script. Understand what Push displays and why.

**Failure mode.** Overloading a remote script to do DSP work (should
be M4L). Overloading an M4L device to do controller mapping that
should be a remote script.

---

## Stage 6: External apps and sync

**Objective.** Know when the right solution lives outside Live.

**Read.** `docs/reference/node-for-max.md`. (An Ableton Link reference
note is planned but not yet written — for Link specifics, consult the
official Link repository at https://github.com/Ableton/link.)

**Mastery.** Architect a companion tool that syncs with Live via
Link. Know when Node for Max is right vs when a standalone app is
right.

**Failure mode.** Trying to cram a multi-app sync system into a
single Max for Live device. Using Link for things Link doesn't do
(it syncs tempo/beat/phase, not transport state of individual
tracks).

---

## Stage 7: External plugins in Live

**Objective.** Reason about plugin-in-Live validation.

**Read.** `docs/research/live-as-plugin-host.md`,
`docs/reference/lom/plugindevice.yaml`.

**Mastery.** Know what questions to ask of a plugin's behavior
inside Live specifically, separate from cross-DAW plugin concerns.
Acknowledge the gaps in our current understanding rather than
bluff.

**Failure mode.** Assuming Live is just another host, missing its
specific parameter exposure / Configure dialog model.

---

## Stage 8: Compatibility, corruption, recovery

**Objective.** Think like a release engineer.

**Read.** `docs/reference/als-file-format-primer.md`,
`docs/reference/crash-recovery.md`,
`docs/principles/parameter-identity.md` (again, in this context),
`docs/principles/release-discipline.md` (again, in this context).

**Mastery.** Given a "my set won't open" report, walk through
diagnosis: autosave, backup folder, crashes log, XML inspection.
Know which actions are safe on a user's set and which are not.

**Failure mode.** Treating a user's Live Set file as disposable,
experimenting destructively.

---

## Stage 9: Frontier reasoning

**Objective.** Investigate, don't bluff.

**Read.** `docs/research/*.md` (all), `experiments/*/SPEC.md` (all),
`docs/_meta/METHODOLOGY.md` sections 6 and 7.

**Mastery.** Recognize an unknown when you see one. Propose a
smallest-useful experiment. Run it, capture results, upgrade an
`inference` claim to `experiment` or downgrade it to `open`. Write
the RUNLOG honestly.

**Failure mode.** Pretending certainty to look competent. Running
an experiment and only reporting the outcome that confirms what
you hoped.

---

## Cross-cutting habits (always)

1. State the surface before proposing the approach.
2. Separate fact from inference in every answer.
3. Name tradeoffs — good solutions have costs.
4. Think in failure modes, not happy paths.
5. Design for save/reload and migration before shipping.
6. When uncertain, design the smallest useful experiment.

## What mastery looks like overall

An AI built on this repo should be able to:

- Route a new idea to the correct surface.
- Sketch an implementation path across that surface.
- Identify where edge cases will matter.
- Propose a testing plan that catches what matters before release.
- Produce a release dossier that would pass review.
- Acknowledge uncertainty without sounding lost.
- Generate creative, forward-looking ideas grounded in the platform's
  real constraints.

The curriculum is not a checklist of things to memorize. It is a
progression of judgments the system should make confidently and
correctly.
