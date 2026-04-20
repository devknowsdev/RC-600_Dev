---
id: meta-state
title: Repository State
surface: meta
evidence: official
confidence: high
last_verified: 2026-04-20
---

# State

**Version:** v0.1 (bootstrap 2026-04-20)
**Phase:** Bootstrap. Meta layer written. Reference layer not yet started.
**Firmware target:** Boss RC-600 v1.50
**Linter status:** Adapted for RC-600 schema. Not yet run against full file set.
**Experiments run:** 0 of 1 spec. `results/` empty.
**Eval harness:** Not written.

## What exists

- `README.md`, `AGENTS.md`, `LICENSE`, `CHANGELOG.md` — adapted (GPT session 2026-04-20)
- `docs/_meta/METHODOLOGY.md` — RC-600 adapted (Claude Sonnet 2026-04-20)
- `docs/_meta/frontmatter-schema.md` — RC-600 adapted
- `docs/_meta/STATE.md` — this file
- `docs/adr/001-scope-and-purpose.md` — explains repo existence and two-surface model
- `experiments/01-rc0-schema-capture/SPEC.md` — first experiment spec, awaiting hardware run
- `docs/principles/assign-budget.md` — 16-slot ASSIGN constraint
- `docs/principles/backup-discipline.md` — always work on a copy
- `docs/principles/wav-format-discipline.md` — WAV import constraints
- `tools/lint-frontmatter.py` — adapted for RC-600 schema
- Reference scaffold: `docs/reference/parameters/`, `fx/`, `midi/`, `rc0-schema/`

## What does not exist yet

- Any `docs/reference/parameters/` YAML content — blocked on Parameter Guide PDF + MEMORY.RC0
- Any `docs/research/` content
- `tests/eval/` questions
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
docs/copilot-architecture-v1.md
docs/curriculum/
docs/reference/als-file-format-primer.md
docs/reference/automation-vs-modulation.md
docs/reference/crash-recovery.md
docs/reference/liveapi-cheatsheet.md
docs/reference/liveapi-js-notes.md
docs/reference/lom/
docs/reference/midi-tools-api.md
docs/reference/node-for-max.md
docs/reference/push-integration.md
docs/reference/remote-scripts-overview.md
docs/reference/threading-and-deferral.md
```

## Standing priorities

1. **ROUTE:HUMAN** — Delete orphaned Ableton files listed above
2. **ROUTE:HUMAN** — Get `MEMORY01A.RC0` from pedal, add to `experiments/01-rc0-schema-capture/results/`
3. **ROUTE:HUMAN** — Add RC-600 Parameter Guide PDF + Owner's Manual PDF to repo root
4. **ROUTE:SONNET** — Analyse RC0 file once present, produce `results/rc0-structure.yaml`
5. **ROUTE:GPT** — Extract Parameter Guide to YAML files once PDFs are in repo
6. **ROUTE:SONNET** — Write `tests/eval/` questions (20 questions testing RC-600 knowledge)
