# AGENTS.md

Canonical instructions for AI sessions on this repository.

## 1. What this repo is

A knowledge and tooling repository for evolving an AI into an expert-level assistant for the BOSS RC-600 Loop Station and related live-looping workflows.

The repo will contain:
- structured reference material (device behavior, memory structure, MIDI/USB control)
- principles (safe operation, performance workflows, recall integrity)
- experiment specs (hardware verification)
- eval harness (does the AI actually understand the device?)

Integrity standard: every factual claim must declare its evidence class (`official`, `experiment`, `inference`, `open`). A fabricated claim is worse than a gap.

## 2. Source of truth

GitHub is the source of truth.

- `AGENTS.md` = canonical instructions
- `docs/_meta/STATE.md` = current repo state
- `HANDOVERS/` = session log

## 3. Roles and routing

→ ROUTE:GPT — verification, cross-checking, consistency
→ ROUTE:SONNET — scaffolding, structured docs, code
→ ROUTE:OPUS — architecture, synthesis
→ ROUTE:HUMAN — hardware testing (RC-600), file drops, decisions

## 4. Standards

### Evidence discipline
- No `official` without a real source
- No `experiment` without captured results
- Use `inference` when reasoning from knowledge

### No phantom references
Do not reference presets, memory files, MIDI mappings, or experiments that do not exist.

### Hardware reality
All claims about RC-600 behavior must consider:
- memory slots
- loop structure
- tempo sync
- MIDI/USB control
- save/load persistence
- real performance conditions

## 5. Current phase

Bootstrap.

Priorities:
1. Establish reference structure
2. Define experiment templates
3. Begin device-behavior mapping

## 6. Repo shape

rc600_dev/
- docs/
- experiments/
- examples/
- tools/
- tests/

Keep structure minimal until real data exists.
