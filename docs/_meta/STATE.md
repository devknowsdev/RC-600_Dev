---
id: meta-state
title: Repository State
surface: meta
evidence: official
confidence: high
last_verified: 2026-04-20
---

# State

**Version:** v0.2 (experiment 01 complete, 2026-04-20)
**Phase:** Bootstrap complete. Experiment 01 run. Reference layer unblocked.
**Firmware target:** Boss RC-600 v1.50
**Linter status:** Adapted for RC-600 schema. Not yet run against full file set.
**Experiments run:** 1 of 1 spec. Results in `experiments/01-rc0-schema-capture/results/`.
**Eval harness:** Not written.

## What exists

- `README.md`, `AGENTS.md`, `LICENSE`, `CHANGELOG.md` — adapted
- `docs/_meta/METHODOLOGY.md`, `frontmatter-schema.md`, `STATE.md` — RC-600 adapted
- `docs/adr/001-scope-and-purpose.md`
- `docs/principles/assign-budget.md`, `backup-discipline.md`, `wav-format-discipline.md`
- `tools/lint-frontmatter.py` — RC-600 adapted
- `experiments/01-rc0-schema-capture/` — SPEC + results (RUNLOG + rc0-structure.yaml)
- Reference scaffold placeholders in `docs/reference/parameters/`, `fx/`, `midi/`, `rc0-schema/`

## Key findings from experiment 01

- `.RC0` files are valid UTF-8 XML. `evidence: experiment`.
- Root: `<database name="RC-600" revision="0"><mem id="0">...</mem></database>`
- All parameter values use **opaque single-letter child elements (A, B, C...)** with numeric values. No human-readable names. A lookup table is required.
- All 16 ASSIGN slots confirmed (`<ASSIGN1>`–`<ASSIGN16>`, 10 fields each).
- Input FX and Track FX storage location not yet identified.
- The 16 ASSIGN limit appears structurally enforced (exactly 16 elements in the file).

## What does not exist yet

- Single-letter field lookup table (blocks full parameter YAML extraction)
- `docs/reference/parameters/` YAML content
- `docs/reference/rc0-schema/` lookup table
- `tests/eval/` questions
- `docs/research/` content
- Bridge/script layer

## Cleanup needed — manual deletion required

The GitHub MCP cannot delete files. Delete these via local git or GitHub web UI:

```
write-test.md
maxdevtools-main/
claude_report_ableton_dev_2_final_2026-04-17.md
project-instructions.md
LOM - The Live Object Model - Max 8 Documentation.pdf
Node for Max API _ Cycling '74 Documentation.pdf
The LiveAPI Object - Max 8 Documentation.pdf
docs/curriculum/
docs/reference/lom/
```

Note: Ableton reference files in `docs/reference/` have been overwritten with deprecation stubs.

## Standing priorities

1. **ROUTE:HUMAN** — Delete orphaned Ableton files listed above
2. **ROUTE:SONNET (coding)** — Build RC-Editor source cross-reference to produce the single-letter field lookup table (`docs/reference/rc0-schema/field-lookup.yaml`)
3. **ROUTE:GPT (extractor)** — Extract Parameter Guide to YAML files (track.yaml first, per process sync doc). PDFs now confirmed in project.
4. **ROUTE:SONNET (auditor)** — Review GPT's track.yaml output
5. **ROUTE:SONNET** — Write `tests/eval/` questions once reference layer has content
