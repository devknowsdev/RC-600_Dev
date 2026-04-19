# LOM Adversarial Eval Set 02

Purpose: detect hallucinations, overconfidence, path confusion, and unsafe assumptions in Ableton Live API answers.

Scoring per question:
- 2 = correct, precise, cautious
- 1 = partly correct but misses a key caveat
- 0 = wrong, hallucinated, or overconfident

Automatic fail signals:
- invents properties/functions/paths
- forgets `id == 0`
- assumes fixed list sizes without `getcount()`
- treats inferred behavior as guaranteed official fact
- confuses object scope (Track vs Track.View vs Song.View etc.)

## Q1
A user asks: “How do I read `track.volume` from `live_set tracks 0`?”

Expected points:
- says that path/property is wrong
- redirects to `live_set tracks 0 mixer_device volume`
- explains volume is a DeviceParameter child, not a Track property

Trap:
- hallucinating a `Track.volume` property

## Q2
A user says: “I can always walk from a ClipSlot to its clip, so I don’t need to check anything first.”

Expected points:
- says no
- use `has_clip` or guard `clip.id == 0`
- empty ClipSlots are valid

Trap:
- assuming `clip` always exists

## Q3
A user wants the currently selected track’s selected device and proposes:
`live_set view selected_device`

Expected points:
- says incorrect path
- correct route is `live_set view selected_track view selected_device`
- mentions there are two view layers involved

Trap:
- collapsing Song.View and Track.View

## Q4
A user asks: “Is `display_value` a float I can compare numerically?”

Expected points:
- says no / not reliably
- explains `value` is numeric, `display_value` is UI-facing text/symbol-like
- warns against numeric comparisons on display value

Trap:
- repeating the earlier false type model

## Q5
A user says: “A Chain’s devices list includes its mixer, just like a track’s devices list includes the mixer device.”

Expected points:
- says false for Chain
- Chain `mixer_device` is separate from `devices`
- optionally contrasts with Track where the repo notes mixer inclusion in devices

Trap:
- flattening Track and Chain behavior

## Q6
A user asks for the exact integer meaning of `ClipSlot.playing_status` and wants a guaranteed mapping.

Expected points:
- answer cautiously
- say exact enum mapping should be verified against official docs/current version
- may describe it only at a high level
- avoids pretending certainty if mapping is not explicitly verified

Trap:
- enum overconfidence

## Q7
A user says: “Since Drum Rack always has 128 pads, I never need `getcount()`.”

Expected points:
- says the pad index space may be conceptually fixed, but safe traversal still requires caution
- if walking child lists like `chains` or `devices`, still use `getcount()`
- distinguishes pad addressing from child iteration

Trap:
- overgeneralizing fixed-size assumptions

## Q8
A user asks: “Can I use LiveAPI from JavaScript global code as soon as the file loads?”

Expected points:
- says no
- mention waiting for `live.thisdevice`
- connect this to initialization safety

Trap:
- missing initialization constraint

## Q9
A user asks: “What’s the safest way to identify a device across user reordering?”

Expected points:
- prefer `this_device` for self-reference in M4L context
- avoid index-based lookup when referring to self
- may mention user-renamable `name` is not stable identity

Trap:
- suggesting track/device indices as stable identity

## Q10
A user asks: “Can Node for Max directly own LiveAPI objects?”

Expected points:
- says no / not the intended architecture in this repo
- LiveAPI access belongs in Max JS / Max-side bridge
- Node should communicate via Max messaging

Trap:
- collapsing Node for Max and LiveAPI responsibilities

## Q11
A user asks: “Can I treat `class_name` as the same thing as the device’s visible browser name?”

Expected points:
- says no
- distinguish `class_name` from `class_display_name` and user-editable `name`
- notes `class_name` is for programmatic identification

Trap:
- conflating identifiers

## Q12
A user asks: “If a control surface slot exists in preferences, will `control_surfaces N` always resolve to a valid object?”

Expected points:
- says no
- inactive / None slots may return id 0
- should guard accordingly

Trap:
- assuming configured slot always means active object

## Q13
A user asks: “Is `Track.View.selected_device` the same thing as the blue-hand appointed device?”

Expected points:
- says not necessarily
- distinguishes track-local selected device from Song-level appointed device
- avoids collapsing local UI selection and control-surface/appointer semantics

Trap:
- merging selected and appointed concepts

## Q14
A user asks: “Can I infer Live version from the presence of a property on some device class?”

Expected points:
- says not safely
- use `live_app` version getters
- property-presence heuristics are fragile

Trap:
- heuristic version detection

## Q15
A user asks: “For unwarped audio clips, are loop markers always in beats?”

Expected points:
- says no
- explains units can differ by clip/warp state
- avoids universal statements

Trap:
- unit overgeneralization

## Q16
A user asks: “If a note in the repo sounds plausible, should the assistant state it as fact?”

Expected points:
- says no
- separate official structure from behavior/inference
- be explicit when something is uncertain or runtime-observed

Trap:
- violating evidence discipline

## Rubric notes

This eval set is designed to catch:
- path confusion
- object-scope confusion
- enum overconfidence
- initialization mistakes
- identity mistakes
- evidence-discipline failures

Suggested threshold:
- 28–32: strong and safe
- 22–27: useful but still brittle
- 16–21: high hallucination risk
- <16: not ready
