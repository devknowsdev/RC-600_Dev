# ableton_dev

An AI-assisted Ableton development workspace. The goal is to accumulate knowledge
and artifacts rigorous enough that a language model can reason about Max for Live,
the Live API, remote scripts, external plugins, Link, and Push with the judgment
of an experienced practitioner — not merely the recall of an average one.

## Status

**Active rebuild, v0.2.** The previous iteration of this repo conflated
specification with substance. This rebuild corrects that. Every file declares its
evidence class, target Live/Max version, and confidence level in frontmatter.
Claims not grounded in an official source or a run experiment are marked
`evidence: inference` and are held to a lower standard of trust.

Target platform: **Live 12 + Max 8.6 (current stable).** The LOM reference layer
is anchored to Max 8 documentation (which covers Live 12.1). Features added in
Live 12.2+ are flagged inline via `available_since` metadata; they are documented
but not assumed to work on the target stack.

## What this repo contains

```
docs/
  reference/          Platform facts. Verified against official docs.
    lom/              One YAML file per LOM object (Song, Track, Device, ...)
    liveapi-cheatsheet.md
    liveapi-js-notes.md
    threading-and-deferral.md
    ...
  principles/         Normative guidance. How we do things.
    max-for-live-principles.md
    parameter-identity.md
    undo-discipline.md
    observer-architecture.md
  research/           Open questions + case studies. Evidence-classified.
    selection-vs-deterministic.md
    live-as-plugin-host.md
    ...
  curriculum/         Staged learning path with concrete artifact dependencies.
    curriculum.md
  adr/                Architectural Decision Records for the repo itself.
  _meta/              Methodology, frontmatter schema, contribution norms.
    METHODOLOGY.md
    frontmatter-schema.md
prompts/              System prompts for AI assistants in different roles.
reference/            Curated index of external official docs (links only).
examples/             Runnable artifacts. Each has its own README + test plan.
  m4l/
  liveapi-js/
  remote-scripts/
experiments/          Experiment specifications. Hypothesis → method → capture.
  Each has a results/ subfolder that stays empty until someone runs it.
tests/eval/           Question bank + rubrics for evaluating what the repo can answer.
tools/                Scripts: frontmatter linter, LOM coverage report, etc.
templates/            Starting points: case study, release dossier, experiment spec.
```

## How to read this repo

If you are a human engineer:
1. `docs/_meta/METHODOLOGY.md` — the rules we hold ourselves to.
2. `docs/curriculum/curriculum.md` — the staged mental model.
3. `docs/reference/liveapi-cheatsheet.md` — operational quick reference.
4. `docs/reference/lom/*.yaml` — per-object API facts when precision matters.
5. `docs/principles/*` — when building a device, before shipping.
6. `docs/research/*` — when something is genuinely unclear.

If you are a language model:
- Treat any claim without a `source:` or `verified_in:` field as inference.
- Treat `evidence: inference` files as worth less than `evidence: official`.
- If a user question touches automation, undo, recall, multi-instance, or
  save/reload, consult `docs/principles/` before answering.
- Prefer the `docs/reference/lom/` YAML over the markdown cheatsheet when
  precision matters. The YAML is the ground truth; the cheatsheet is a summary.

## Evidence classes (used throughout)

| Class | Meaning |
| --- | --- |
| `official` | Claim is supported by a cited official source. A URL or doc name is required. |
| `experiment` | Claim is supported by a run experiment with captured results in this repo. An experiment file path is required. |
| `inference` | Claim is a reasoned deduction from other verified facts. Must label what it derives from. Lower trust. |
| `open` | Claim is an open question. Not a weakness — a research target. |

`experiment` cannot be asserted without a corresponding file in `experiments/.../results/`.
The frontmatter linter (`tools/lint-frontmatter.py`) enforces this.

## What this repo does not do

- It does not mirror official Ableton or Cycling '74 docs. It indexes them and
  extracts operational patterns.
- It does not ship fabricated experimental data. When an experiment has not been
  run, the results folder is empty and the note that cites it says so.
- It does not pretend certainty on version-sensitive or platform-sensitive
  behavior. Those are captured as research notes or experiment specs.

## Contributing

See `CONTRIBUTING.md` for the acceptance standard. Short version: every new
technical note must pass the frontmatter linter and must either cite a source
or mark itself `evidence: inference`. Experiments go in `experiments/`, not as
inline claims in prose notes.

## License

MIT. See `LICENSE`.
