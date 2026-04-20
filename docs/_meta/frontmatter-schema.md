---
id: meta-frontmatter-schema
title: Frontmatter Schema
surface: meta
evidence: inference
confidence: high
last_verified: 2026-04-20
---

# Frontmatter Schema

Every markdown file in `docs/` and every `experiments/*/SPEC.md` must include a YAML frontmatter block. The linter (`tools/lint-frontmatter.py`) enforces this.

## Required fields

```yaml
id: string            # Unique identifier, kebab-case. Convention: surface-topic
title: string         # Human-readable title
surface: string       # One of: meta | reference | principle | research | experiment | adr | example
evidence: string      # One of: official | experiment | inference | open
confidence: string    # One of: high | medium | low
last_verified: date   # ISO date (YYYY-MM-DD)
```

## Optional fields

```yaml
firmware_version: string   # Target firmware version (e.g. "1.50"). Required when surface is reference.
verified_in: string        # Firmware version claims were verified against
available_since: string    # Firmware version that introduced this feature
source: string             # URL or doc reference. Required when evidence is official.
source_section: string     # Section or page in source doc (e.g. "Parameter Guide p. 18")
experiment_path: string    # Path to experiments/ dir. Required when evidence is experiment.
related: list              # List of related file ids
tags: list                 # Free-form tags
```

## Constraints

- `confidence: high` requires `evidence: official` or `evidence: experiment`. `confidence: high` + `evidence: inference` is a lint error.
- `evidence: official` requires `source:`.
- `evidence: experiment` requires `experiment_path:` pointing to a directory whose `results/` subfolder is non-empty.
- `surface: reference` requires `firmware_version:`.

## Example

```yaml
---
id: ref-track-parameters
title: Track Parameters
surface: reference
firmware_version: "1.50"
verified_in: "1.50"
evidence: official
confidence: high
source: RC-600 Parameter Guide Ver. 1.3 (firmware 1.5)
source_section: "p. 1-5"
last_verified: 2026-04-20
related: [ref-loop-parameters, ref-assign-sources]
---
```
