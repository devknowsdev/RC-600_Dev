---
id: adr-001-rebuild-from-v01
title: "ADR-001: Complete rebuild from v0.1"
surface: meta
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: high
last_verified: 2026-04-16
---

# ADR-001: Complete rebuild from v0.1

**Status:** Accepted.
**Date:** 2026-04-16.

## Context

The v0.1 state of this repository consisted of 22 markdown files totaling
~120 KB of methodology and vision prose, with zero code, zero patches, no
folder structure matching the README, and — most seriously — research
notes citing experimental evidence from files that did not exist.

An audit identified six categories of problems:

1. Structural fictions (README describes folders that don't exist;
   research notes cite scaffolds that don't exist).
2. Duplication and versioning sloppiness (two cheatsheet files with
   overlapping names, four overlapping meta-docs).
3. Abstraction without substrate — methodology without the facts it was
   meant to govern.
4. Reference content with specific errors (mixer-parameter path
   semantics, missing `id 0` handling, missing `getcount`, missing
   observer callback signature).
5. Missing critical domains (threading, automation-vs-modulation, `.als`
   format, Push, Node for Max, MIDI Tools, crash recovery, remote
   scripts).
6. Missing operational infrastructure (no `.gitignore`, no LICENSE, no
   CONTRIBUTING, no linter, no evaluation harness).

## Decision

Rebuild the repository rather than patch it incrementally. Preserve the
useful methodological concepts from v0.1 but re-express them in a
smaller number of tighter documents. Replace all reference content with
content verified against official sources (Cycling '74's Max 8 LOM
documentation, anchored to Live 12.1). Add the missing domains as
either filled references or honest `evidence: inference` /
`confidence: low` stubs with bibliographies for future filling.

## Key design choices

- **Folder structure now matches the README.** The README is the ground
  truth for where things live.
- **YAML frontmatter on every note** with machine-enforceable evidence
  and confidence fields. Linter in `tools/lint-frontmatter.py` rejects
  PRs that violate the schema.
- **Per-LOM-object YAML reference** in `docs/reference/lom/`. Structured
  data, not prose. An AI reading the repo can reason over it directly.
- **Experiments are specs, not claims.** `experiments/<nn-slug>/SPEC.md`
  describes hypothesis, method, and expected outcome before running.
  `results/` is empty until someone runs it. Notes that depend on those
  experiments are marked `evidence: inference` until `results/` has
  content.
- **Target stack declared.** Live 12 + Max 8.6. Features from later
  versions (e.g. `insert_device` from 12.3) are flagged with
  `available_since`, not silently documented.
- **Evaluation harness** in `tests/eval/` provides a feedback loop on
  whether the repo is improving. Without it, "is this better than v0.1"
  is unanswerable.

## Consequences

Positive:

- The repo's self-claimed evidence discipline is now true.
- Missing domains are registered as gaps rather than hidden.
- The LiveAPI reference errors from v0.1 are corrected.
- Contributors have a clear acceptance bar.

Negative / open:

- Most research notes drop from `evidence: experiment` (claimed
  dishonestly in v0.1) to `evidence: inference` (honest). This looks
  like regression. It isn't — it's correction.
- Experiment `results/` directories are empty. Filling them requires
  someone with Max and Live to run the specs. The specs provide the
  scaffolding; the work remains.
- Several domain references are `confidence: low` stubs-with-bibliography.
  They exist as registered gaps, not coverage. Future work is to
  promote them.

## What this ADR does not do

- Does not lock in the file structure permanently. Future ADRs may
  restructure as the repo grows.
- Does not mandate that every existing tool or example be rebuilt.
  The v0.1 state had no tools or examples to preserve.
- Does not specify a release version scheme for the repo itself.
  That belongs in a future ADR once the evaluation harness has given
  us enough signal to know what "v0.3" should mean.

## Migration from v0.1

No migration needed. v0.1 contained no data that should survive. The
methodology content was re-expressed; no artifacts or working code
existed.
