---
id: eval-harness
title: Evaluation question bank
surface: meta
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: medium
last_verified: 2026-04-16
---

# Evaluation question bank

20 questions spanning the curriculum stages. For each: the question, the
curriculum stage it tests, the repo files that should be sufficient to
answer it, a rubric, and a reference answer.

Use this to score whether the repo (used as context by an AI) produces
expert-level answers. A passing score means the knowledge layer is ready
to support Phase 2 tooling.

## Scoring

Each question is scored 0–3:

- **3** — Correct, specific, hedges appropriately, cites relevant
  constraints, names failure modes.
- **2** — Mostly correct, minor omissions or imprecision.
- **1** — Partially correct but missing critical distinctions or
  containing errors.
- **0** — Wrong, vague, or fabricated.

Passing: ≥ 48/60 (80%).

---

## Questions

### Q01 — Stage 0: Surface classification

**Question:** A producer wants to build a tool that lets them tap a
rhythm on their phone screen and have it quantize into a MIDI clip on
their currently selected track in Live. What development surface should
this use, and why?

**Files needed:** `docs/curriculum/curriculum.md`, `docs/reference/node-for-max.md`

**Rubric:** Must identify this as requiring two surfaces — a mobile app
(external app / possibly Link for sync) and a Max for Live device or
remote script to receive the tapped rhythm and write it into a clip.
Must NOT say "just build a Max for Live device" — M4L runs inside Live,
not on a phone. Must mention either OSC, WebSocket, or a network
protocol as the bridge.

**Reference answer:** The phone-side is a standalone app (iOS/Android).
The Live-side is a Max for Live device using Node for Max to run a local
server (WebSocket or OSC) that receives tap data from the phone over the
local network. The M4L device then uses the LiveAPI's clip note API
(`add_new_notes` on the selected track's clip) to insert quantized MIDI.
If tempo sync matters, Ableton Link could synchronize the tap grid.
This is a multi-surface solution — external app + M4L + possibly Link.

---

### Q02 — Stage 1: Live as host

**Question:** A Max for Live device works perfectly when tested in an
empty Live Set but fails intermittently when loaded into the user's
production set. What are the three most likely categories of cause?

**Files needed:** `docs/principles/max-for-live-principles.md`,
`docs/reference/threading-and-deferral.md`

**Rubric:** Must name at least: (1) initialization order / timing
sensitivity when other devices and automation are active, (2) multi-
instance or global-name collision with other devices in the set, (3) CPU
budget exhaustion under real load. Bonus for mentioning selection-
context dependency or threading.

---

### Q03 — Stage 2: LOM path construction

**Question:** Write the canonical path to reach the volume parameter
of the third return track's mixer. Explain what type of object you
arrive at and what property you'd read to get the dB value.

**Files needed:** `docs/reference/lom/mixerdevice.yaml`,
`docs/reference/lom/deviceparameter.yaml`,
`docs/reference/liveapi-cheatsheet.md`

**Rubric:** Path must be `live_set return_tracks 2 mixer_device volume`.
Must state that `volume` is a DeviceParameter child (not a property of
MixerDevice). Must say to read `value` for the internal float or
`display_value` for the dB string. Deduct if they say `get volume` on
the MixerDevice itself — that was the v0.1 repo's error.

---

### Q04 — Stage 2: id 0 handling

**Question:** You call `new LiveAPI("live_set view detail_clip")` and
get back an object whose `.id` is `0`. What does this mean and what
should your code do?

**Files needed:** `docs/reference/liveapi-cheatsheet.md`

**Rubric:** Must explain id 0 = null reference / no object at that
path (no clip is shown in the detail view). Code must guard against
it — don't proceed with reads or writes.

---

### Q05 — Stage 3: Observer leak

**Question:** A colleague writes a JS utility that creates a
`new LiveAPI(callback)` inside `onSelectionChanged()` every time the
user switches tracks. After 30 minutes of use, Live becomes sluggish.
Diagnose the problem and write the corrected pattern.

**Files needed:** `docs/principles/observer-architecture.md`,
`docs/reference/liveapi-js-notes.md`

**Rubric:** Must identify the leak: JS LiveAPI observers can't be
unregistered, so each call accumulates. Must show the "create once,
repoint via `.id`" fix. Deduct if they suggest `delete` or
`removeListener` — those don't exist.

---

### Q06 — Stage 3: Write from callback

**Question:** Your observer callback needs to mute a track when a
parameter crosses a threshold. Can you call `api.set("mute", 1)` inside
the callback? If not, what do you do?

**Files needed:** `docs/reference/threading-and-deferral.md`,
`docs/reference/liveapi-js-notes.md`

**Rubric:** Must say no — you cannot modify the Live Set from inside an
observer notification. Must show deferral via `Task.schedule(0)` in JS
or `[defer]` in a patch.

---

### Q07 — Stage 4: Parameter naming

**Question:** You're about to ship v1.0 of a Max for Live device with
a filter. The parameter is currently named "Freq" (Short) / "Frequency"
(Long). A colleague suggests renaming the Long Name to "Filter
Frequency" for clarity before shipping. Is this safe? What if v1.0 is
already in users' hands?

**Files needed:** `docs/principles/parameter-identity.md`

**Rubric:** Before v1.0 ships: safe, rename freely. After v1.0 ships:
**not safe** — changing the Long Name breaks automation, MIDI mappings,
and macro mappings in existing user sets. Must recommend keeping
"Frequency" as Long Name and changing Short Name to "Filt Freq" instead,
or documenting it as a breaking change in a major version bump.

---

### Q08 — Stage 4: Undo flooding

**Question:** Your device has an internal LFO that modulates a
`[live.dial]`'s value at 20 Hz. Users report that Cmd-Z no longer works
properly. Explain the problem and propose two solutions.

**Files needed:** `docs/principles/undo-discipline.md`,
`docs/reference/automation-vs-modulation.md`

**Rubric:** Must identify undo flooding: each `set value` via
`[live.object]` creates an undo entry. 20 Hz = 1200/min. Solutions must
include `[live.remote~]` and/or hiding the parameter's visibility.
Deduct if they suggest `[defer]` as the fix — deferring doesn't prevent
undo entries, it just changes the thread.

---

### Q09 — Stage 5: Push banking

**Question:** Your M4L device has 12 exposed parameters. How does Push
display them, and what should you do to make the display usable?

**Files needed:** `docs/reference/push-integration.md`

**Rubric:** Must explain: Push shows 8 parameters per bank, so 12
parameters = 2 banks. Must say to define bank layout explicitly
(not rely on default order), group related parameters in the same bank,
and pick Short Names that fit Push's character width.

---

### Q10 — Stage 5: Remote script vs M4L

**Question:** A hardware controller manufacturer wants to build a
deep integration with Live — transport control, mixer mapping, and a
custom clip-launch workflow. Should this be a Max for Live device or a
remote script?

**Files needed:** `docs/reference/remote-scripts-overview.md`,
`docs/curriculum/curriculum.md`

**Rubric:** Must say remote script. Reasoning: controller integration is
a different surface from audio/MIDI device building. Remote scripts
(Python, running inside Live) are the official mechanism for control
surfaces. M4L would be wrong because it requires instantiation in a
device chain and doesn't naturally map to hardware transport buttons.

---

### Q11 — Stage 6: Node for Max scope

**Question:** You want your M4L device to make HTTP requests to a
cloud API. Can you do this from `[js]`? If not, what should you use?

**Files needed:** `docs/reference/node-for-max.md`

**Rubric:** Must say no — Max's `[js]` (V8 runtime) does not have
network access. Must recommend Node for Max (`[node.script]`) which runs
a separate Node.js process with full network capability. Must mention
the IPC overhead / async nature.

---

### Q12 — Stage 7: Plugin parameter visibility

**Question:** A user loads a third-party VST3 synth in Live and
complains that only 8 of its 200 parameters appear in the automation
chooser. Is this a bug?

**Files needed:** `docs/research/live-as-plugin-host.md`,
`docs/reference/lom/plugindevice.yaml`

**Rubric:** Must explain the Configure button: Live only exposes plugin
parameters that have been explicitly configured (banked) by the user.
This is by design, not a bug. The user needs to click Configure on the
device header and add the desired parameters.

---

### Q13 — Stage 8: Crash recovery

**Question:** A user's Live Set won't open — Live crashes on load. Walk
them through recovery steps.

**Files needed:** `docs/reference/crash-recovery.md`,
`docs/reference/als-file-format-primer.md`

**Rubric:** Must mention: (1) check Backup/ folder for earlier saves,
(2) check autosave/Undo directory, (3) check Log.txt for the crash
cause, (4) as a last resort, decompress the `.als` (gzip XML), inspect
for corruption, attempt to trim the corrupted region and re-save. Must
warn against modifying the original file — work on copies.

---

### Q14 — Stage 8: .als inspection

**Question:** You suspect a Max for Live device update broke automation
in a user's set. How would you diagnose this without opening Live?

**Files needed:** `docs/reference/als-file-format-primer.md`,
`docs/principles/parameter-identity.md`

**Rubric:** Must describe: decompress the `.als`, search the XML for
the device's automation lanes, check whether the parameter Long Names
in the automation bindings match the updated device's parameters. If
they don't match, that's the break. Must mention that the `.als` is
gzip-compressed XML.

---

### Q15 — Stage 9: Experiment design

**Question:** You suspect that `[live.remote~]` modulation values
persist after the modulation source stops — meaning the parameter stays
at the last written value rather than snapping back to its stored value.
Design the smallest experiment that would confirm or deny this.

**Files needed:** `docs/_meta/METHODOLOGY.md`,
`experiments/_template/SPEC.md`

**Rubric:** Must propose: (1) a device with one parameter at a known
default, (2) `[live.remote~]` driving it to a non-default value, (3)
stop the modulation source, (4) read the parameter value — is it the
last-written value or the default? (5) save the set, reload, read
again. Must specify what outcome confirms vs falsifies.

---

### Q16 — Cross-cutting: fact vs inference

**Question:** Is the following claim verified or inference? "Changing a
parameter's Long Name after shipping a device will break automation
lanes in existing user Live Sets."

**Files needed:** `docs/principles/parameter-identity.md`

**Rubric:** Must identify this as `evidence: inference` — the repo's
parameter-identity note explicitly marks it as such and identifies
`experiments/02-parameter-rename-migration/` as the experiment needed
to upgrade it. Deduct if they say "verified" without qualification.

---

### Q17 — Cross-cutting: getcount

**Question:** Write JavaScript to iterate all devices on the currently
selected track and post each device's name. Include all safety checks.

**Files needed:** `docs/reference/liveapi-cheatsheet.md`,
`docs/reference/liveapi-js-notes.md`

**Rubric:** Must use `getcount("devices")` before iterating. Must check
`id == 0` on the selected track. Must use a correct path construction
(not `"id " + track.id + " devices " + i` without checking that
`track.id` isn't already prefixed). A clean answer looks like:

```javascript
function listDevices() {
  var track = new LiveAPI("live_set view selected_track");
  if (track.id == 0) { post("no track selected\n"); return; }
  var n = track.getcount("devices");
  for (var i = 0; i < n; i++) {
    var d = new LiveAPI("live_set view selected_track devices " + i);
    if (d.id == 0) continue;
    post(i + ": " + d.get("name") + "\n");
  }
}
```

---

### Q18 — Cross-cutting: initialization

**Question:** Your M4L device's `[js]` creates a `LiveAPI` object at
the top level of the script file. It works sometimes and fails sometimes
on set load. Why?

**Files needed:** `docs/reference/threading-and-deferral.md`,
`docs/reference/liveapi-js-notes.md`

**Rubric:** Must explain: LiveAPI cannot be used in JS global (top-
level) code because the API may not be ready when the script loads.
Must recommend waiting for `live.thisdevice` to bang before
constructing any LiveAPI objects.

---

### Q19 — Cross-cutting: multi-instance

**Question:** Two instances of your M4L device are on different tracks.
When you change a parameter on one, the other changes too. What's the
most likely cause?

**Files needed:** `docs/principles/max-for-live-principles.md`

**Rubric:** Must identify global naming: the device uses a `[send]` /
`[receive]` pair (or `[buffer~]`, `[coll]`, `[dict]`, `[table]`) with
a name that doesn't use the Max `---` local-scope prefix. Both
instances share the same named channel. Fix: prefix with `---`.

---

### Q20 — Cross-cutting: evidence discipline

**Question:** You've read a community forum post claiming that
`DeviceParameter.value` is always in the range 0.0–1.0 for all
parameters. How would you classify this claim using this repo's evidence
system, and what would you do before relying on it?

**Files needed:** `docs/_meta/METHODOLOGY.md`,
`docs/reference/lom/deviceparameter.yaml`

**Rubric:** Must classify as unverified — community forum is not an
official source. Must note that the LOM says `value` is between `min`
and `max`, which are per-parameter and NOT necessarily 0.0–1.0 (mixer
volume min/max differ from a filter frequency min/max). Must recommend
checking the LOM page and/or testing in Live before relying on the
claim. Bonus for noting that the claim is specifically wrong — many
parameters have ranges well outside 0–1.
