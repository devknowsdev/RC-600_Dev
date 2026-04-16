---
id: principle-parameter-identity
title: Parameter identity and migration safety
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: medium
last_verified: 2026-04-16
related: [principle-max-for-live, principle-release-discipline, research-parameter-migration-patterns]
---

# Parameter identity and migration safety

A Max for Live device is not a library function. Once shipped, it is a
**persistence contract** — Live Sets across every user's machine contain
references to the device's parameters by name. Changing those names
after release breaks compatibility silently.

This note defines the discipline we apply to parameter identity. It
supersedes the previous repo's `parameter-identity-and-migration-safety.md`,
which was abstract and evidence-unclear. Here we are concrete about what
breaks, what doesn't, and why.

Marked `evidence: inference` because the precise behavior of Live's
parameter-matching-on-load across all rename scenarios is not documented
in detail by Ableton; we treat the conservative set of rules below as
our working discipline. Running `experiments/02-parameter-rename-migration/`
would raise this to `evidence: experiment`.

---

## What gets persisted in a Live Set

When a user saves a Live Set containing a Max for Live device, the set
records, per exposed parameter:

1. The parameter's **Long Name** (the full name shown in the automation
   chooser).
2. The parameter's current value.
3. If automated: a lane of breakpoints keyed to the parameter.
4. If MIDI-mapped: a mapping linking a MIDI CC to the parameter.
5. If macro-mapped (when the device is in a Rack): a macro mapping.
6. If modulated by another M4L device or `[live.remote~]`: that binding.

All of those (2–6) **find the parameter by Long Name** when the set is
reopened. If the Long Name matches, the binding restores. If it does
not, the binding is orphaned — the user sees an automation lane with no
target, or a MIDI mapping that silently does nothing.

This is why Long Names are the compatibility boundary.

---

## The change-risk taxonomy

### Low risk (safe in a released device)

- Changing the parameter's **Short Name**. Short Name is not used for
  persistence matching.
- Changing the parameter's **value range** (min/max), as long as the
  stored values remain inside the new range, or are clamped correctly.
  Note: stored values outside the new range may behave surprisingly.
- Changing the parameter's **visible unit** or display format (as long
  as the internal `value` semantics don't change).
- Adding new parameters. (They default to their default on old-set
  load.)
- Changing purely cosmetic properties: label color, tooltip.

### Medium risk (requires care)

- Reordering parameters. Parameter order affects the patcher's **parameter
  bank** layout, which affects Push. Old sets will still find parameters
  by Long Name, so automation isn't broken — but Push muscle memory is
  broken, which is still a UX regression.
- Changing a parameter's **type** (continuous → enum, bool → continuous).
  The stored value is a float; a new type may reinterpret it in ways
  that look wrong to the user even when the mapping "restores". E.g. a
  0.5 on a continuous dial becomes index 0 on a new enum, which may be
  the wrong choice.
- Removing a parameter. Existing bindings become orphans. Document this
  in release notes so users know automation will be dropped.

### High risk (avoid after release)

- **Renaming a parameter's Long Name.** This is the canonical breaking
  change. All existing automation / mappings / modulations pointing at
  the old name become orphans.
- Changing a parameter's **is_quantized** status in a way that changes
  how value_items are indexed. Old stored indices point to different
  labels.
- Changing the device's internal routing so that the same-named parameter
  now affects different DSP. The binding restores, but the sound doesn't.

---

## Safe rename strategies

If you must rename a Long Name, options in order of preference:

1. **Don't.** Adjust the Short Name to clarify UX; leave the Long Name
   alone.
2. **Add a new parameter with the better name, leave the old one as a
   deprecated alias.** Have the old parameter's value drive the new
   one internally, or route both to the same DSP. Mark the old one as
   "(deprecated)" in its Short Name so users stop using it for new
   mappings. Document the alias in release notes.
3. **Break the contract intentionally, major version.** If the device
   is genuinely being rebuilt, ship as a new device (new `.amxd`
   filename) rather than attempting to upgrade the existing one in
   place. Old users continue on the old version; new users start on
   the new. This is honest about the incompatibility.

---

## The release-time parameter diff

Before shipping any update, produce a diff of the parameter table:

| Long Name | Short Name | Min | Max | Default | is_quantized | Type | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

For each parameter in the release, compared against the previous
release:

- **Unchanged Long Name** → safe.
- **Changed Long Name** → flag in release notes.
- **New parameter** → document it.
- **Removed parameter** → flag as migration-breaking.

This table belongs in the release dossier (`templates/device-release-dossier.md`).

The tool `tools/parameter-diff.py` (planned) can generate this table by
comparing two frozen `.amxd` files. Until that tool is written, fill it
in by hand from the patcher.

---

## What remains uncertain

- Whether Live tolerates Long Name changes when the rest of the
  parameter's attributes (position, type, range) are unchanged — some
  community sources suggest Live does fuzzy-match in narrow cases.
  Worth running `experiments/02-parameter-rename-migration/` to pin
  this down.
- Whether macro-mapped parameters behave identically to directly-bound
  ones under rename.
- The exact behavior under clip-envelope (modulation) bindings vs
  automation lane bindings.

Until those are pinned down by experiment, the conservative rule applies:
**Long Names do not change after release.** Full stop.

---

## Checklist for any device update

- [ ] Did any Long Name change? If yes: document, mitigate, or reject.
- [ ] Did any parameter's type change? If yes: audit stored-value
      interpretation.
- [ ] Did any parameter get removed? If yes: document.
- [ ] Did parameter order change? If yes: check Push banking UX.
- [ ] Did any parameter's default change? If yes: note that new
      instances will behave differently from recalled old ones.
- [ ] Has at least one real user-saved Live Set been opened with the
      new version as a regression check?
