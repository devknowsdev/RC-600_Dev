---
id: meta-frontmatter-schema
title: Frontmatter schema
surface: meta
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: high
last_verified: 2026-04-16
---

# Frontmatter schema

All Markdown files in `docs/reference/`, `docs/principles/`, `docs/research/`,
`docs/curriculum/`, `docs/adr/`, and `experiments/*/SPEC.md` must begin with YAML
frontmatter conforming to this schema. `tools/lint-frontmatter.py` enforces it.

## Required fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable slug. Kebab-case. Must be unique across the repo. Changing this is a breaking change for cross-references. |
| `title` | string | Human-readable title. Should match the first H1 in the file. |
| `surface` | enum | One of: `m4l`, `liveapi`, `liveapi-js`, `remote-script`, `plugin-host`, `link`, `push`, `packaging`, `meta`, `multi`. |
| `live_version` | string | The Live version(s) this note applies to. Use `"12.x"` for "Live 12, any point release we target." Use a specific version like `"12.1"` when tied to a specific version. |
| `max_version` | string | Same rules for Max. `"8.6"` is our target. |
| `evidence` | enum | `official`, `experiment`, `inference`, `open`. |
| `confidence` | enum | `high`, `medium`, `low`. |
| `last_verified` | date | ISO date. When the claims were last checked against source. |

## Conditionally required fields

- If `evidence: official`, **`source:`** is required. Either a URL or a specific
  document + section name.
- If `evidence: experiment`, **`experiment_path:`** is required. Must be a path
  (relative to repo root) to a directory in `experiments/` whose `results/`
  folder contains at least one non-empty file.
- If `surface` is a specific surface (not `meta` or `multi`), and the note
  describes a feature introduced after our target version, **`available_since:`**
  is required and takes a version string.

## Optional fields

| Field | Type | Notes |
| --- | --- | --- |
| `supersedes` | list of ids | Notes this one replaces. |
| `superseded_by` | string (id) | Set when this note is itself replaced. |
| `related` | list of ids | Cross-references. |
| `tags` | list | Free-form, but prefer an existing tag if one fits. |
| `observed_on` | list | Platforms where experiment results have been captured: `macos`, `windows`, `push2`, `push3`. Used with `evidence: experiment`. |
| `author` | string | Credit. |

## Example: reference note grounded in official source

```yaml
---
id: ref-lom-song
title: Song (LOM object)
surface: liveapi
live_version: "12.1"
max_version: "8.6"
evidence: official
confidence: high
source: "https://docs.cycling74.com/apiref/lom/song/"
last_verified: 2026-04-16
related: [ref-lom-track, ref-lom-scene]
---
```

## Example: research note with mixed evidence

```yaml
---
id: research-observer-architecture
title: Observer architecture in LiveAPI utilities
surface: liveapi-js
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: medium
last_verified: 2026-04-16
related: [principle-observer, exp-03-observer-rebind-stress]
---
```

(Note: the research note cites `exp-03-observer-rebind-stress` as *related*, not
as *evidence*, until the experiment has been run.)

## Example: experiment spec

```yaml
---
id: exp-01-undo-flood-reproducer
title: "Experiment 01: Reproduce undo flooding from internal modulation"
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: open
confidence: low
last_verified: 2026-04-16
related: [principle-undo-discipline]
---
```

(Experiments start as `evidence: open` with `confidence: low`. After they are run
and results captured, a linked note may upgrade its claim to
`evidence: experiment` referencing the specific result file.)

## What the linter checks

See `tools/lint-frontmatter.py`. Summary:

1. Frontmatter parses as valid YAML and contains the required fields.
2. `id` is unique across the repo.
3. If `evidence: experiment`, `experiment_path` resolves and contains results.
4. If `evidence: official`, `source` is present and non-empty.
5. `confidence: high` requires `evidence` to be `official` or `experiment`.
6. `last_verified` is a valid ISO date not more than 18 months old (warning
   above 12 months, error above 18).
7. Every value in `related:` and `supersedes:` resolves to a real `id` in the repo.
