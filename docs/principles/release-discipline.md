---
id: principle-release-discipline
title: Release discipline for Max for Live devices
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: medium
last_verified: 2026-04-16
related: [principle-max-for-live, principle-parameter-identity, principle-undo-discipline]
---

# Release discipline

A device being "ready to share" is a different state from "the patch works."
This note defines what has to be true before a Max for Live device crosses
the source-to-release boundary.

---

## The two layers

**Source.** Unfrozen `.amxd` (or `.maxpat` project), editable in Max.
Lives in git. This is what we develop from.

**Release.** Frozen `.amxd` with dependencies embedded. This is what users
get. Lives as a release artifact — in a `release/` subfolder of the
example directory, as a GitHub release asset, or in a distribution pack.

Never develop from a frozen file. Never distribute an unfrozen one.

## The release checklist (dossier-driven)

Before any device moves from source to release, fill in
`templates/device-release-dossier.md`. Summary:

### Parameter review

- [ ] All exposed parameters have explicit Short and Long Names.
- [ ] Parameter identity unchanged from previous release, OR changes
      documented in release notes with migration notes.
- [ ] Parameter diff table completed against previous release.
- [ ] Default values are intentional (not "0 because that's where I
      left it").

### Save / recall review

- [ ] Save a set with the device in a non-default state. Close Live.
      Reopen. All parameters restored.
- [ ] Duplicate the device within the set. Both instances behave
      independently.
- [ ] Copy the device to a different set. It loads and behaves correctly.

### Undo / automation review

- [ ] No parameter writes from internal code at > 1 Hz via
      `[live.object]`.
- [ ] Automation records on every exposed parameter correctly.
- [ ] Manual override of automation sets `automation_state` to 2.
- [ ] Re-enable Automation restores playback control.
- [ ] Undo after 10 real edits: undo count is ~10, not hundreds.

### UI review

- [ ] Presentation mode is intentional. Fixed width, pixel-aligned
      controls.
- [ ] Device reads in both Light and Dark Live themes.
- [ ] Short Names fit the displayed space (consider Push).
- [ ] No overlapping UI elements.

### Multi-instance / scope review

- [ ] Named `[send]` / `[receive]` / `[buffer~]` etc. use local scope
      (Max `---` prefix) unless intentionally global.
- [ ] Multiple instances in one set do not interact unintentionally.
- [ ] Global resources (if any) are documented as such.

### Console review

- [ ] No errors or warnings emitted on device load.
- [ ] No errors or warnings during normal operation.
- [ ] No errors or warnings on device deletion.
- [ ] Intentional `post()` output uses a consistent prefix so users
      can recognize it.

### CPU / performance review

- [ ] CPU usage at idle is negligible.
- [ ] CPU usage at full use is within the expected budget.
- [ ] Multiple simultaneous instances scale reasonably (sub-linearly
      where possible).
- [ ] If targeting Push 3 Standalone: tested on actual Push 3.

### Platform review

- [ ] Tested on macOS.
- [ ] Tested on Windows, OR platform limitation explicitly declared in
      release notes.
- [ ] Tested on Apple Silicon, OR limitation declared.

### Freeze review

- [ ] Freeze produces a standalone `.amxd`.
- [ ] Frozen device opened and tested on a machine that does not have
      the source project.
- [ ] Frozen file size reasonable for the content.
- [ ] Dependencies included; no "missing sample" or "missing object"
      errors on open.

### Documentation review

- [ ] README describes what the device does and how to use it.
- [ ] Any non-obvious UI behavior is documented (tooltips where
      possible).
- [ ] Known issues listed.
- [ ] Compatibility statement: "Requires Live 12, Max 8.6" or similar.

## Version numbering

Use semver-inspired numbering:

- **Major** (`2.0`): breaking parameter-identity change. Old sets may
  not upgrade cleanly.
- **Minor** (`1.2`): new features or parameters added. Old sets upgrade
  with new params at defaults.
- **Patch** (`1.1.3`): bug fixes, internal changes, UI tweaks. No
  parameter change.

The device's internal version (stored somewhere the user can see, e.g.
a hidden label) should match the release tag.

## Release notes are mandatory

Even for internal / small-circle releases, write release notes covering:

- What changed.
- What was tested.
- What is known to be broken.
- Any migration steps for users of the previous release.

A device with a version bump and no release notes is a release without
a changelog, which is a silent breaking change waiting to happen.

## The "did I really test it" gate

Two questions to ask before shipping:

1. **Have you opened a real, messy, in-progress Live Set of yours with
   this device in it, and used it alongside your normal workflow for
   at least 30 minutes?** Testing in a dedicated empty set catches
   maybe 60% of issues. The rest only show up in the context of real
   usage.

2. **If a user reports a bug tomorrow, can you reproduce their
   environment?** If you can't answer "yes" to "what Live version,
   what Max version, what OS, and what device version", you don't
   have a diagnostic path.

If either answer is no, you are not ready to release. Iterate.
