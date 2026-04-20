---
id: meta-working-history-roadmap
title: Working History and Roadmap
surface: meta
evidence: inference
confidence: high
last_verified: 2026-04-20
related: [meta-frontmatter-schema]
---

# Working History and Roadmap

This file is the running implementation log for the RC-600 tooling work carried out in the repository after the Ableton-derived scaffold began being adapted into an RC-600-first repo.

It is intentionally practical rather than architectural. It records what changed, what is now working, what remains uncertain, and what should happen next.

## Current state summary

The repo now has a usable first-pass RC0 analysis pipeline:

1. Frontmatter validation was adapted away from the previous Ableton-specific assumptions.
2. Cross-reference checking was restored in the frontmatter linter.
3. RC0 inspection tooling now exists and does not assume strict XML.
4. RC0 path extraction and diff tooling now exists.
5. Candidate-ranking and mapping-validation helpers now exist.
6. Focused experiment comparison tooling now exists for cleaner single-parameter RC0 experiments.

This is enough to begin disciplined RC0 mapping experiments without fabricating parser support or semantic certainty.

## Changelog

### 2026-04-20 — Frontmatter tooling migration and repair

#### `tools/lint-frontmatter.py`

Implemented or restored:

- removed hard dependency on `live_version` and `max_version`
- aligned required fields with RC-600 repo use
- allowed RC-600-oriented surfaces such as `reference`, `principle`, `research`, `experiment`, `adr`, `example`, `meta`
- kept date/staleness checks
- kept evidence checks
- required `firmware_version` for `surface: reference`
- restored second-pass cross-reference validation for:
  - `related`
  - `supersedes`
  - `superseded_by`

Result:

The linter is now useful for RC-600 repo artifacts rather than silently preserving inherited Live/Max assumptions.

#### `docs/_meta/frontmatter-schema.md`

Updated to reflect the RC-600-oriented frontmatter contract.

Result:

Repo schema and linter are now substantially closer to each other, though future tightening is still possible.

### 2026-04-20 — RC0 inspection layer added

#### `tools/inspect-rc0.py`

Added a read-only RC0 inspection utility.

Behavior:

- detects binary vs text-like RC0 files
- reports XML declaration presence
- reports root-like `<database>` structure
- detects content after closing root
- counts tags
- flags numeric tag names such as `<0>`
- refuses to pretend binary files are XML/text

Reason:

Observed RC0 files include:

- XML-like text files
- binary files
- non-standard tag structures that make direct XML parser use unsafe

Result:

The repo now has a safe first inspection layer for RC0 inputs.

### 2026-04-20 — RC0 path extraction layer added

#### `tools/extract-rc0-paths.py`

Added a read-only path extraction utility.

Behavior:

- extracts deterministic hierarchical paths from text-like RC0 files
- preserves exact observed hierarchy
- supports optional value emission
- supports summary mode
- supports multi-file cross-file summary

Example path style:

- `database/mem/TRACK1/A`
- `database/mem/PLAY/F`
- `database/ifx/AA_STEP_SLICER/0`

Result:

The repo now has a bridge from raw RC0 text structure to line-oriented, diffable path inventories.

### 2026-04-20 — RC0 diff layer added

#### `tools/diff-rc0-paths.py`

Added a read-only path/value diff tool.

Behavior:

- compares two RC0 files
- reports:
  - left-only paths
  - right-only paths
  - changed shared paths
  - unchanged count
- supports:
  - `--summary-only`
  - `--changed-only`

Result:

The repo can now compare two memory/system exports deterministically without XML assumptions.

### 2026-04-20 — RC0 candidate-ranking layer added

#### `tools/suggest-rc0-candidates.py`

Added a read-only helper that ranks changed RC0 path families by mapping promise.

Behavior:

- compares two RC0 files
- groups changed paths into families
- ranks them into:
  - `HIGH_PRIORITY_CANDIDATES`
  - `MEDIUM_PRIORITY_CANDIDATES`
  - `LOW_PRIORITY_CANDIDATES`
- emits a `GROUP_SUMMARY`

Important observed output from a real MEMORY001A vs MEMORY001B comparison:

High-priority families surfaced as:

- `database/mem/TRACK*/J`
- `database/mem/TRACK*/R`

Lower-priority noise included clustered IFX/TFX payload drift.

Result:

The repo can now distinguish likely mapping candidates from preset-payload churn.

### 2026-04-20 — RC0 mapping validation layer added

#### `tools/check-rc0-mappings.py`

Added a read-only validator that compares extracted parameter YAML against observed RC0 candidate families.

Behavior:

- parses extraction YAML with a `parameters:` list
- compares declared `xml_path` scope against observed RC0 changed families
- reports:
  - `CONFIRMED_STRUCTURE_MATCHES`
  - `PLAUSIBLE_BUT_UNCONFIRMED`
  - `UNMAPPED_PARAMETERS`
  - `SUSPICIOUS_MAPPINGS`
  - `SUMMARY`

Important observed output from a real temporary track-parameter YAML plus MEMORY001A/MEMORY001B comparison:

- 17 parameters were classified as `PLAUSIBLE_BUT_UNCONFIRMED`
- none were `SUSPICIOUS`
- none were `UNMAPPED`

Interpretation:

The extraction YAML currently claims broad track-level scope only, which is structurally supported by repeated RC0 track families, but not enough to confirm specific parameter-to-field mappings.

Result:

The repo now has a mechanism for preventing overclaiming while still recording structural support.

### 2026-04-20 — Focused experiment comparison layer added

#### `tools/compare-rc0-experiments.py`

Added a read-only helper for controlled RC0 experiments.

Behavior:

- compares two RC0 files
- supports:
  - `--focus`
  - `--exclude-ifx`
  - `--exclude-tfx`
- outputs:
  - `FOCUSED_CHANGED_PATHS`
  - `REPEATED_TRACK_FIELD_CHANGES`
  - `LOCALIZED_MEMORY_CHANGES`
  - `SUPPRESSED_NOISE_SUMMARY`
  - `SUMMARY`

Important observed output from a real focused run on MEMORY001A vs MEMORY001B:

Focused changes reduced to:

- `database/mem/TRACK1/J`
- `database/mem/TRACK1/R`
- `database/mem/TRACK2/J`
- `database/mem/TRACK2/R`
- `database/mem/TRACK5/J`
- `database/mem/TRACK5/R`
- `database/mem/TRACK6/J`
- `database/mem/TRACK6/R`

And repeated-track families were isolated as:

- `database/mem/TRACK*/J`
- `database/mem/TRACK*/R`

With noise summary:

- 6 IFX changes suppressed
- 19 TFX changes suppressed

Result:

The repo now has a practical experiment-comparison tool for single-parameter mapping work.

## Evidence-backed current findings

### RC0 file reality

Current tooling and experiments are based on observed properties of actual RC0 files used during this work:

- some RC0 files are text-like and XML-shaped but not safely parseable as standard XML
- some RC0 files are binary
- numeric tags exist in at least some structures
- direct use of a normal XML parser would be an unsafe assumption at this stage

### Track mapping candidates currently surfaced

From the current focused experiment comparison, the strongest repeated track-field candidates are:

- `database/mem/TRACK*/J`
- `database/mem/TRACK*/R`

These are currently the best next mapping targets.

What is still unknown:

- which user-facing manual parameter each corresponds to
- whether one field is primary and the other derived
- whether both fields are part of a single stored behavior

## What is working now

The following tasks are now practical in-repo:

- validate RC-600 repo frontmatter against current schema assumptions
- inspect RC0 files safely without pretending they are valid XML
- extract deterministic RC0 paths
- diff RC0 path/value sets
- rank changed RC0 path families by mapping promise
- validate extraction YAML against observed RC0 structural evidence
- suppress IFX/TFX noise during controlled experiment comparisons

## What is still blocked or incomplete

### 1. No confirmed parameter-to-field mappings yet

Current tools can isolate candidate families, but they do not yet confirm which manual parameter maps to which RC0 field.

This is an experiment-design limitation, not a tooling absence.

### 2. Extraction artifacts are not yet fully repo-native

At least one working track-parameter extraction YAML used during validation was created as a temporary local file rather than committed repo content.

This means the extraction/validation loop is working, but not yet fully operationalized into repo-managed reference artifacts.

### 3. Static structural support is still broad

Current YAML `xml_path` values such as `TRACK1–TRACK6` are broad scope markers, not specific field mappings.

This is acceptable for now, but not sufficient for fine-grained automation.

## Recommended next experiments

These are the best next hardware-first experiments to run.

### Experiment pattern

For each test:

1. duplicate a baseline memory
2. change exactly one track parameter on hardware
3. save/export both RC0 files
4. compare using:

```bash
python3 tools/compare-rc0-experiments.py \
  BASELINE.RC0 \
  CHANGED.RC0 \
  --focus 'database/mem/TRACK*' \
  --exclude-ifx \
  --exclude-tfx
```

### Best first parameter targets

1. `REVERSE`
2. `1SHOT`
3. `PLAY MODE`

Why these first:

- they are binary or small-enum settings
- they should produce cleaner diffs than routing-style or multi-source parameters
- they are likely to help separate `TRACK*/J` and `TRACK*/R`

## Roadmap

### Immediate next step

Run single-parameter RC0 experiments to determine whether:

- only `TRACK*/J` changes
- only `TRACK*/R` changes
- both change together

This is the shortest path from candidate families to grounded mappings.

### Near-term tooling follow-up

After a few single-parameter experiments, add a small helper to record experiment outcomes in a normalized form.

Possible future utility:

- `tools/log-rc0-experiment-result.py`

Potential job:

- take baseline/changed diff output
- record:
  - parameter changed on hardware
  - track targeted
  - changed RC0 families
  - confidence level
  - open questions

This would turn ad hoc terminal outputs into durable mapping evidence.

### Medium-term repo improvement

Commit extraction artifacts into repo paths that the validator can use directly, rather than temporary local files.

Desired outcome:

- extraction YAML lives in repo
- validator can be run as a normal repo command
- suspicious mappings can be blocked before merge

### Longer-term goal

Move from broad scope declarations like `TRACK1–TRACK6` toward disciplined mapping records such as:

- scope supported
- candidate field family observed
- experiment evidence attached
- mapping still open / provisionally supported / confirmed

That would make the RC-600 repo increasingly self-correcting and automation-friendly.

## Guidance for future contributors

When extending this work:

- do not replace RC0 regex/tag-stack tooling with a normal XML parser unless a file is proven well-formed XML first
- do not claim semantic parameter mappings from structural scope alone
- prefer single-change hardware experiments over interpretation-heavy speculation
- preserve read-only, deterministic tool behavior
- treat IFX/TFX payload churn as likely noise unless an experiment specifically targets FX parameters

## Short status line

The repo now has enough tooling to do disciplined RC0 mapping experiments safely.

It does not yet have confirmed track parameter mappings, but it has isolated the strongest current candidates and reduced the remaining uncertainty to a manageable experiment problem.
