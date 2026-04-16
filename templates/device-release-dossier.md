# Device release dossier

> Fill this in before shipping any Max for Live device update. See
> `docs/principles/release-discipline.md` for the full rationale.

## Device name

## Version (this release)

## Version (previous release, if any)

## Device type

- [ ] MIDI Effect
- [ ] Audio Effect
- [ ] Instrument
- [ ] Utility / Other

## Purpose of this release

(Why is this version being shipped? What changed from the previous?)

## Source artifact

- Source path:
- Frozen: [ ] yes  [ ] no
- Main dependencies:

---

## Parameter identity review

### Parameters unchanged from previous release

| Long Name | Short Name | Type | Min | Max | Default |
| --- | --- | --- | --- | --- | --- |

### Parameters changed

| Long Name (old → new) | Change type | Risk |
| --- | --- | --- |
| | | Low / Medium / High |

### Parameters added

| Long Name | Short Name | Type | Min | Max | Default |
| --- | --- | --- | --- | --- | --- |

### Parameters removed

| Long Name | Impact |
| --- | --- |

---

## Save / recall review

- [ ] All parameters recalled correctly after save/reload
- [ ] Non-default states tested
- [ ] Duplicated device instances tested
- [ ] Old sets opened with new version (when applicable)

## Undo / automation review

- [ ] No internal writes via `[live.object]` at > 1 Hz
- [ ] Automation records on every exposed parameter correctly
- [ ] Manual override sets `automation_state` to 2
- [ ] Re-enable Automation restores playback
- [ ] Undo depth is proportionate to user actions (not flooded)

## UI review

- [ ] Presentation mode is intentional and pixel-aligned
- [ ] Reads in Light and Dark Live themes
- [ ] Parameter names are meaningful (not generic defaults)
- [ ] Device width is appropriate
- [ ] Context-sensitive devices communicate their target

## Multi-instance / scope review

- [ ] Named objects use `---` prefix or are intentionally global
- [ ] Multiple instances do not interfere

## Console review

- [ ] No errors/warnings on load
- [ ] No errors/warnings during normal operation
- [ ] No errors/warnings on deletion

## CPU / performance review

- [ ] Idle CPU is negligible
- [ ] Active CPU is within budget
- [ ] Multiple instances scale reasonably
- [ ] Push 3 Standalone tested (if claiming Push support)

## Platform / version review

- Live version(s) tested:
- Max version(s) tested:
- macOS tested: [ ] yes  [ ] no  [ ] n/a
- Windows tested: [ ] yes  [ ] no  [ ] n/a
- Apple Silicon tested: [ ] yes  [ ] no  [ ] n/a

## Freeze review

- [ ] Frozen `.amxd` exists
- [ ] Frozen version tested on machine without source project
- [ ] File size reasonable
- [ ] No missing dependencies on open

## Known uncertainties

(What hasn't been confirmed? Be explicit.)

## Release confidence

- [ ] High
- [ ] Medium
- [ ] Low

Justification:

## Release decision

- [ ] Okay for internal testing
- [ ] Okay for limited external testing
- [ ] Okay for broader release
- [ ] Not ready

Justification:

## Follow-up tasks

-
