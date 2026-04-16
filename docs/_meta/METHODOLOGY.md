---
id: meta-methodology
title: Methodology
surface: meta
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: high
last_verified: 2026-04-16
---

# Methodology

This document consolidates the rules the repository holds itself to. It replaces
the previous `expert-repo-vision.md`, `knowledge-standards.md`, `research-workflow.md`,
and the habits section of the curriculum.

If you are writing a note, skim this first. If you are reading a note, this is
the contract it is written under.

---

## 1. Evidence classes

Every technical claim belongs to one of four classes. They are declared in
frontmatter (`evidence:`) and are the basis of how much trust a reader should
extend.

**official** — Supported by a cited official source. The frontmatter must
include `source:` with a URL or an exact doc+section reference. If the source
ever disappears, the claim drops to `inference` until re-sourced.

**experiment** — Supported by an experiment run in this repository. The
frontmatter must include `experiment_path:` pointing to a directory in
`experiments/` whose `results/` folder contains actual captured output. If the
experiment has not been run, this class cannot be used — even if the author is
confident the experiment would succeed.

**inference** — A reasoned deduction from other verified facts. The note must
say what it is inferring from. Lower trust. Do not write "this is clearly true"
here; write "this follows if A and B hold."

**open** — A question not yet resolved. This is the frontier layer. Open
questions are first-class content, not failures.

A single note may contain multiple claims with different classes. The
frontmatter records the strongest class present; inline annotations can
downgrade individual claims.

## 2. The five questions every deep note answers

A note on a technical topic should make these easy to find:

1. **What is the topic?** One sentence, concrete.
2. **What is verified?** What the cited sources or experiments clearly support.
3. **What is uncertain?** What remains to be confirmed and why it matters.
4. **Why does this matter?** What decision or design depends on it.
5. **What consequence follows?** Code, test, or documentation implication.

If a note has no answer to question 5, it is probably describing rather than
concluding. That is legitimate for reference material but not for principles
or research.

## 3. Separate fact from implication

Inside a note:

- **Verified** — what the evidence directly supports.
- **Implication** — what probably follows for design.
- **Risk** — what might still go wrong.
- **Action** — what to do differently in code, tests, or docs.

The previous version of this repo blurred these, which is how speculative
advice ended up reading like verified fact.

## 4. Edge cases are first-class

For every topic where edge cases plausibly matter, ask:

- What happens with zero tracks, devices, or clips?
- What happens when the user changes selection mid-operation?
- What happens with multiple instances of the device?
- What happens after save and reload?
- What happens under automation?
- What happens in undo/redo?
- What happens across Live versions?
- What happens across macOS and Windows?

A note that ignores these when they apply is incomplete. This is the single
biggest quality axis for Ableton-related work.

## 5. Confidence discipline

| Level | When to use |
| --- | --- |
| high | `evidence: official` or `evidence: experiment` with direct support |
| medium | Evidence is strong but version-sensitive or partial |
| low | Mostly inference; would benefit from direct Live/Max validation |

`confidence: high` with `evidence: inference` is a lint error. If you are
highly confident and cannot cite, run an experiment.

## 6. Experiments before claims

An experiment has the shape:

- **Hypothesis** — what we expect to observe and why.
- **Method** — steps concrete enough that another person can reproduce.
- **Capture** — what data to record (console output, `.als` state,
  screenshots, timings).
- **Expected result** — the outcome that would confirm the hypothesis.
- **Alternative outcomes** — what other outcomes mean.

Experiments live in `experiments/<nn-slug>/`. The `SPEC.md` is written before
running; `results/` is populated when running; `RUNLOG.md` in results captures
the specific environment and what was seen.

Until `results/` contains data, any note that references the experiment must
cite it as `evidence: inference`, not `evidence: experiment`.

## 7. Source, inference, and the boundary

The previous repo's single most damaging failure was citing experiments that
did not exist. To prevent recurrence:

- The frontmatter linter fails any note with `evidence: experiment` whose
  `experiment_path` does not resolve.
- Cross-references to examples or experiments that do not yet exist use the
  tag `planned:` rather than presenting them as existing.
- "We have a utility that demonstrates..." is only a valid sentence when that
  utility exists at a specific path in this repo.

## 8. Version sensitivity

Live and Max change. Our target stack is **Live 12 + Max 8.6** (see README).

- Reference facts are tagged `verified_in: "12.1"` (or the actual version the
  source doc covers).
- Features introduced after 12.1 use `available_since: "12.x"`.
- Features deprecated or changed get a note in `docs/research/` and a link
  from the affected reference page.

Do not silently document a Live 12.3 feature without flagging it. The repo is
used by an LLM whose training data may be older; hiding version info causes
silent errors.

## 9. Platform realism for M4L devices

When a note discusses Max for Live device design, it should think about:

- Parameter identity and recall across set saves.
- Undo flooding from internal modulation.
- Multi-instance behavior and name scoping.
- CPU and latency in a real session.
- Frozen vs unfrozen source separation.
- UI behavior across Live color themes.
- Push display and banking, if Push support is intended.

A note that ignores these for a device-design topic is making the prototype /
product mistake.

## 10. What to avoid

- Undocumented claims presented as fact.
- Long notes with no named consequence.
- Summaries of official docs with no added judgment.
- Innovation notes with no implementation path.
- Edge-case observations with no reproduction conditions.
- Files that duplicate official docs verbatim — link instead.
- Multiple files on the same topic that do not cross-reference.

## 11. What success looks like

A good artifact in this repo helps a future AI or a future human do at least
one of these better:

- reason more accurately about a Live API question,
- implement more safely,
- test more intelligently,
- diagnose more deeply when something goes wrong,
- preserve compatibility more carefully across releases,
- invent new tooling grounded in the real platform.

If a proposed file does none of these, it probably does not belong.
