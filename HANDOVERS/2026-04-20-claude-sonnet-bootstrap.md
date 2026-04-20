# HANDOVER — Claude Sonnet — 2026-04-20

## Session summary

Bootstrap session. Established the RC-600_Dev meta layer from scratch.

## What was done

1. **Write access** — diagnosed and resolved PAT scope issue across multiple attempts. Write access confirmed at 2026-04-20 ~18:00 UTC.

2. **`docs/_meta/METHODOLOGY.md`** — replaced Ableton-era version with RC-600 adaptation. Removed `live_version`/`max_version` and LiveAPI-specific edge cases. Added RC-600-specific edge cases (power loss, USB storage vs MIDI mode, WAV padding, factory reset variants, firmware update with existing memories).

3. **`docs/_meta/frontmatter-schema.md`** — replaced Ableton-era version. Removed Ableton surfaces. Added `firmware_version` as required field for `surface: reference`. Evidence/confidence rules unchanged.

4. **`docs/_meta/STATE.md`** — reset to accurate RC-600 bootstrap state. Includes explicit cleanup list of all remaining Ableton files (manual deletion required).

5. **`docs/adr/001-scope-and-purpose.md`** — first ADR. Documents why this repo exists, the two-surface model (authoring via .RC0 XML vs runtime via MIDI CC/PC), and what the repo is not.

6. **`experiments/01-rc0-schema-capture/SPEC.md`** — first experiment spec. Hypothesis: .RC0 files are XML. Documents the capture method, what to record, expected and alternative outcomes.

7. **`experiments/01-rc0-schema-capture/results/.gitkeep`** — placeholder. Results empty until hardware run.

8. **`docs/principles/assign-budget.md`** — documents the 16 ASSIGN slots per memory constraint, why it matters, design rules, and one open question (whether the limit is hardware-enforced or UI-only).

9. **`docs/principles/backup-discipline.md`** — always-work-on-a-copy rule with procedure.

10. **`docs/principles/wav-format-discipline.md`** — WAV import constraints with programmatic validation rule.

11. **`tools/lint-frontmatter.py`** — adapted from Ableton version. Removed `live_version`/`max_version` from required fields. Replaced Ableton surfaces with RC-600 surfaces. Added `firmware_version` requirement for `surface: reference`. All other validation logic preserved.

12. **Deprecation stubs** — all remaining Ableton content in `docs/reference/` and `docs/` overwritten with deprecation notices. Files cannot be deleted via MCP; manual deletion still required.

13. **Reference scaffold** — empty `.gitkeep` placeholders in `docs/reference/parameters/`, `fx/`, `midi/`, `rc0-schema/`, `docs/research/`, `tests/eval/`.

14. **`write-test.md`** — test artifact in repo root. Can be deleted.

## What is unfinished

- **Manual deletion required** (MCP cannot delete files):
  - `write-test.md`
  - `maxdevtools-main/`
  - `claude_report_ableton_dev_2_final_2026-04-17.md`
  - `project-instructions.md`
  - The three Ableton PDFs at repo root
  - `docs/curriculum/`
  - `docs/reference/lom/` (entire directory)

- **Blocked on hardware + PDFs** (cannot proceed without these):
  - `experiments/01-rc0-schema-capture/results/` — needs real `MEMORY01A.RC0`
  - `docs/reference/parameters/` — needs Parameter Guide PDF
  - Parameter YAML extraction (GPT role)

- **Not yet written**:
  - `tests/eval/` questions
  - `docs/research/` content
  - `docs/bridge-interface-spec.md` RC-600 version (current file is a deprecation stub)
  - `CONTRIBUTING.md` RC-600 adaptation

## Decisions made

- Ableton files overwritten with deprecation stubs rather than deleted (MCP limitation). This makes them clearly marked but they still exist in git history and the file tree.
- `docs/bridge-interface-spec.md` stubbed as deprecated. A new RC-600 bridge spec should be written only after experiment 01 confirms the .RC0 format and we understand what the authoring surface actually looks like.
- Linter adapted conservatively — only removed Ableton-specific fields, kept all validation logic.

## Open issues

- Does the RC-600 accept SysEx? Affects whether a live bridge beyond MIDI CC/PC is possible. `evidence: open`.
- Is the 16 ASSIGN limit hardware-enforced or UI-only? `evidence: open`.
- .RC0 file format not yet confirmed as XML. Experiment 01 must run before any reference work proceeds.

## Next actions

→ **ROUTE:HUMAN** — Delete the orphaned files listed above via GitHub web UI or local git.
→ **ROUTE:HUMAN** — Get `MEMORY01A.RC0` from pedal, upload to `experiments/01-rc0-schema-capture/results/`.
→ **ROUTE:HUMAN** — Add RC-600 Parameter Guide PDF and Owner's Manual PDF to repo root.
→ **ROUTE:SONNET** — Once RC0 file is present: run experiment 01 analysis, produce `results/rc0-structure.yaml`, update SPEC frontmatter to `evidence: experiment`.
→ **ROUTE:GPT** — Once PDFs are in repo: run parameter extraction starting with `track.yaml` per the process sync doc (Role 1 prompt).
