---
id: research-selection-vs-deterministic
title: Selection-aware vs deterministic tooling
surface: liveapi
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: medium
last_verified: 2026-04-16
related: [ref-liveapi-cheatsheet, ref-lom-song-view, principle-observer-architecture]
---

# Selection-aware vs deterministic tooling

LiveAPI-based tools fall broadly into two categories, each with different
correctness criteria:

- **Selection-aware tools** operate on "whatever the user is currently
  focused on" — the selected track, the detail clip, the highlighted slot.
- **Deterministic tools** operate on a specific structural target —
  "track 0", "the device named X", "the first scene".

They feel similar while designing; they are very different while shipping.
This note works through when each is correct, and what the hybrid patterns
look like.

Marked `evidence: inference` because while the patterns are clearly right
in principle, the specific failure modes we list below would benefit from
reproduction experiments. In the previous repo version, this note claimed
to be backed by a "scaffold already present in `examples/`" that did not
exist — fabrication corrected here.

---

## The core distinction

### Selection-aware

Uses paths through `live_set view`:

- `live_set view selected_track`
- `live_set view detail_device`
- `live_set view detail_clip`
- `live_set view highlighted_clip_slot`
- `live_set view selected_parameter`

**Strength.** Natural and immediate. The user navigates; the tool follows.
No UI needed to pick a target.

**Weakness.** The tool's target is implicit. If the user's focus moves
mid-operation, the operation targets the wrong thing. Testing is harder
because the relevant state lives in Live's UI, not in the tool.

### Deterministic

Uses structural paths:

- `live_set tracks 0`
- `live_set tracks 0 devices 0`
- `live_set scenes 3`

Or: resolves targets by name, finds targets by iterating and matching,
or remembers an object id from a prior explicit user action.

**Strength.** Repeatable. Testable in isolation. The tool's target is
explicit and stable across user focus changes.

**Weakness.** The user must pick targets somehow — by configuring the
tool, by dragging targets onto it, by naming them. More UI, more
setup.

---

## Where each is correct

Selection-aware is correct when:

- The tool exists to accelerate what the user is *currently doing*.
  "Show me info about the device I'm looking at" — the user's focus
  is the input.
- The operation is read-only or reversible. Misfires are cheap.
- The operation completes fast enough that the user can't usefully
  change focus during it.

Deterministic is correct when:

- The operation will run unattended or scheduled.
- The operation is write-heavy or destructive. Targeting the wrong
  object has real cost.
- Multiple operations must be composed against the same target.
- Users may save the device's state and reload — selection state
  won't survive; explicit targets will.

---

## Failure modes of selection-aware tools

### The focus-change race

User clicks "apply" on the tool. Between the click and the tool's read of
`selected_track`, the user clicks a different track (e.g. to dismiss a
tooltip, or because they're navigating with keyboard shortcuts). The tool
applies to the wrong target.

Mitigation: lock the target at the moment of invocation. Don't re-resolve
`selected_track` during execution.

```javascript
function apply() {
  var t = new LiveAPI("live_set view selected_track");
  if (t.id == 0) return;
  var lockedId = t.id;            // capture now
  doWork(lockedId);               // use the captured id
}
```

### The silent-no-target case

No track is selected. `live_set view selected_track` still returns an
object with a non-null `.id`, because Live usually has some selection.
But in edge cases (startup, during track deletion) it may return id 0.
Tools must handle this.

### The deletion race

User selects track 2. Your tool captures its id. Before your tool runs,
the user deletes track 2. Now the captured id is stale. Writes to a
stale id silently fail (or worse, succeed against a different object if
ids get reused — observed in older Live versions, uncertain in 12.x;
worth an experiment).

Mitigation: re-validate the captured id immediately before writing.
Not a full solution — a narrower race window.

### The confusion cost

When a tool operates on "the selected thing" and the user isn't sure
what that is, the tool's behavior looks inconsistent. This is a
long-term UX cost that doesn't show up in isolated testing.

---

## Failure modes of deterministic tools

### Target drift via user editing

Tool targets "track 0". User inserts a new track at position 0. Now the
tool targets what used to be at position 1. `LiveAPI.mode = 0` (follow
object) mitigates this for identity-based tracking, but only if the tool
captured the id at some point. For purely path-based tools, there is no
mitigation short of re-resolving the tool's intent on every run.

### Target-by-name fragility

"Find the track named 'Drums'" works until the user renames it. Tools
that resolve by name should handle the not-found case gracefully and
surface it to the user.

### Setup cost

Every deterministic tool needs a way to configure its target(s). If the
target picker is worse than just doing the work manually, the tool
doesn't pay for itself. This is the "configuration tax" — a tool that
saves 10 seconds of work but costs 30 seconds to configure.

---

## Hybrid patterns

### Pattern: capture-at-drop

User drops a target onto the tool's UI. The tool stores the id (or
better, a stable reference — a canonical path or a name + context).
From then on, the tool operates deterministically on that target.

This is the Max for Live convention for "Scope" or "Target" widgets —
`[live.thisdevice]`-adjacent scoping where the user explicitly picks a
target once.

### Pattern: selection-aware with confirmation

The tool reads the current selection but shows the user what it
resolved to **before** acting. The user confirms or corrects. Takes
an extra click but removes ambiguity.

Good for destructive operations where selection-aware feels right but
confirmation is worth the cost.

### Pattern: deterministic-with-selection-fallback

The tool has an explicit target. If not set, it falls back to selection.
Advanced users pre-configure; casual users rely on focus.

### Pattern: recorded intent

The tool records the user's intent as "the track that contained device X
at the moment of setup", and re-resolves that intent on every run. More
robust than pure path-based or id-based.

---

## Design rule

For a new tool, ask:

1. **Is the operation destructive or write-heavy?** If yes → lean
   deterministic. Use capture-at-drop or explicit configuration.
2. **Is the operation fast and reversible?** Selection-aware is fine.
3. **Will the tool be run while the user is looking somewhere else?**
   Must be deterministic.
4. **Will the tool's result surprise the user if it operates on the
   wrong target?** Add confirmation.

A tool that doesn't answer these questions explicitly is answering
them implicitly, and usually wrongly.

---

## What would make this note stronger

The failure modes above are grounded in observed community reports and
LiveAPI behavior, but the precise timing of focus-change races, the
deletion race's exact id-reuse behavior in Live 12.x, and the cost of
re-validating captured ids would all benefit from reproduction
experiments. Concretely:

- Build a tool that takes an action on `selected_track`. Bind a MIDI
  controller to the action. Rapidly change selection and trigger. Log
  what was captured vs what was touched.
- Build a tool that captures a track id, then delete that track. Try
  to write to the captured id. Document the behavior — error, silent
  no-op, or write against a different object.

These would upgrade this note from `evidence: inference` to
`evidence: experiment`.
