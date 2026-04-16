# Contributing to ableton_dev

This repo has an unusually strict acceptance standard because its purpose is
to train expert judgment. A note that confuses speculation with fact is worse
than no note at all.

## The minimum bar for any new technical note

Every Markdown file in `docs/reference/`, `docs/principles/`, `docs/research/`,
or `experiments/` must:

1. **Have YAML frontmatter** conforming to `docs/_meta/frontmatter-schema.md`.
2. **Declare its evidence class**: `official`, `experiment`, `inference`, or
   `open`. Mixed-evidence notes are allowed but each claim should be attributable.
3. **Cite sources for `official` claims** with a URL or a specific document
   name + section. "The Ableton docs say..." is not a citation. A working link is.
4. **Name the experiment file for `experiment` claims.** If that experiment
   file does not exist in `experiments/`, the claim cannot use the `experiment`
   evidence class. Use `inference` or `open` instead.
5. **Declare its target version**: `live_version`, `max_version`. If a claim
   is version-sensitive, say so.
6. **State what remains uncertain.** A note that says "this is fully known and
   done" is almost always wrong for this domain.

## The lint rule

`tools/lint-frontmatter.py` is run in CI. It will fail the build if:

- Frontmatter is missing or malformed.
- `evidence: experiment` is declared but no `experiment_path` is set, or the
  path does not point to a directory containing a `results/` subfolder with
  at least one result file.
- `evidence: official` is declared but `source` is missing.
- `confidence: high` is declared without `evidence: official` or `evidence: experiment`.

## Folder choice

| If the content is... | It belongs in... |
| --- | --- |
| A verified fact about the platform | `docs/reference/` |
| A per-LOM-object structured reference | `docs/reference/lom/<object>.yaml` |
| Normative guidance ("we do X because Y") | `docs/principles/` |
| An open question or case study | `docs/research/` |
| A runnable experiment | `experiments/<nn-slug>/` |
| Example code or a device | `examples/` |
| A decision about the repo itself | `docs/adr/` |
| A starting template | `templates/` |
| A script that audits or processes the repo | `tools/` |

Prose that doesn't fit any of those probably belongs in a PR discussion, not a
commit.

## Experiments

Experiments have a different shape than notes. See `experiments/_template/` for
the structure. Briefly:

- `SPEC.md` defines the hypothesis, method, and expected outcome **before** the
  experiment is run.
- `results/` stays empty until someone runs the experiment. Results include the
  Live Set(s) used (`.als`), Max console output, screenshots if relevant, and a
  `RUNLOG.md` describing what was observed with date, Live/Max versions, and OS.
- Once results exist, the referencing notes can upgrade their claim from
  `inference` to `experiment` — with a link to the specific results file.

## Style

- Prose, not bullet dumps, except where a list genuinely reflects the structure.
- No "this should" without naming what could go wrong if it doesn't.
- No hedging where the truth is known. If `fire()` on `Scene` has worked for
  a decade, write "calls `fire()`" — don't say "confirm the exact method name
  against the current LOM."
- Hedge where hedging is honest. Version-specific behavior gets an
  `available_since` tag; platform-specific behavior gets an `observed_on` tag.

## What gets rejected

- Restatement of methodology without content ("a good note should be rigorous").
- Claims presented as fact but backed only by memory or plausibility.
- Multiple files on the same topic that don't cross-reference.
- New abstraction layers over existing abstraction layers.
- "We should eventually..." without a file where "eventually" is tracked.
