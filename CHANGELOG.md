# Changelog

All notable changes to this repository.

## [0.3.0] - 2026-04-18

### Added — Phase 2 opening

- `docs/copilot-architecture-v1.md` — v1 architecture spec for the
  Ableton copilot system. MCP-first topology with the MCP server
  hosted inside Node for Max, the JS bridge owning all LiveAPI
  access, three read-only v1 tools (`inspect_selected_track`,
  `inspect_device_at_path`, `list_device_parameters`), and explicit
  deferrals for writes, auth, Push support, and automation.
- Linter scope expanded to include top-level `docs/*.md`.

### Context

This is the first Phase 2 deliverable. The knowledge layer (Phase 1)
is now being used as the grounding for architectural work rather than
being further expanded. Future Phase 2 docs (`bridge-interface-spec.md`,
implementation scaffolds) will follow the same pattern: every claim
traceable to the knowledge base, every design decision marked as
verified or inference, every unresolved area named explicitly rather
than smoothed over.

## [0.2.0] - 2026-04-16

### Changed — Complete rebuild

Previous iteration was a specification-without-substance. This rebuild replaces
it entirely while preserving the useful methodological concepts.

### Added
- Real folder structure matching the README (no more phantom paths).
- YAML frontmatter schema (`docs/_meta/frontmatter-schema.md`).
- Consolidated methodology doc (`docs/_meta/METHODOLOGY.md`) replacing four
  overlapping meta-docs.
- Structured per-LOM-object reference in `docs/reference/lom/*.yaml`.
- Rewritten LiveAPI cheatsheet with corrected mixer-parameter semantics,
  `id 0` handling, `getcount`, observer callback signature.
- Stub-then-fill reference notes for previously-missing domains: threading,
  automation-vs-modulation, `.als` file format, Push integration, crash
  recovery, Node for Max, MIDI Tools API.
- Experiment specifications in `experiments/` with empty `results/` folders
  and RUNLOG templates, awaiting actual execution in Live.
- Frontmatter linter in `tools/lint-frontmatter.py`.
- Evaluation harness scaffold in `tests/eval/`.
- ADR (Architectural Decision Record) system in `docs/adr/`.
- `.gitignore`, `LICENSE`, `CONTRIBUTING.md`.

### Removed
- Claims citing `[x] Repository experiment` for files that did not exist.
- Phantom folder references in README.
- Duplicate cheatsheet files (`live-api-cheatsheet.md` stub superseded).
- Over-abstracted methodology docs (`knowledge-standards.md`,
  `research-workflow.md`, `expert-repo-vision.md` content folded into
  `METHODOLOGY.md`).

### Known limitations of this release
- All experiment `results/` folders are empty. The experiments have not been
  run. Notes that depended on those experiments have been downgraded to
  `evidence: inference` until results exist.
- The Push integration, Node for Max, and MIDI Tools API reference notes are
  bibliographies with skeleton outlines, not full references.
- The example device (`examples/m4l/selected-track-inspector/`) has a complete
  README, decisions log, and test plan, but the `.amxd` / `.maxpat` / `.js`
  files are placeholders awaiting Max-in-hand construction.

## [0.1.0] - pre-2026-04-16

Initial repository as a set of aspirational markdown files. Superseded.
