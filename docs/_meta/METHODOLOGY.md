---
id: meta-methodology
title: Methodology
surface: meta
firmware_version: "1.50"
evidence: inference
confidence: high
last_verified: 2026-04-20
---

# Methodology

This document consolidates the rules this repository holds itself to. It is adapted from the methodology established in `ableton_dev_2` and recalibrated for the Boss RC-600 hardware domain.

If you are writing a note, skim this first. If you are reading a note, this is the contract it is written under.

---

## 1. Evidence classes

Every technical claim belongs to one of four classes. They are declared in frontmatter (`evidence:`) and are the basis of how much trust a reader should extend.

**official** — Supported by a cited official source: the RC-600 Owner's Manual, Parameter Guide, Roland/Boss support articles, or firmware release notes. The frontmatter must include `source:` with a URL or exact doc+section reference.

**experiment** — Supported by an experiment run on real hardware and documented in this repository. The frontmatter must include `experiment_path:` pointing to a directory in `experiments/` whose `results/` folder contains actual captured output. If the experiment has not been run, this class cannot be used.

**inference** — A reasoned deduction from other verified facts. The note must say what it is inferring from. Lower trust. Do not write "this is clearly true" here; write "this follows if A and B hold."

**open** — A question not yet resolved. This is the frontier layer. Open questions are first-class content, not failures.

A single note may contain multiple claims with different classes. The frontmatter records the strongest class present; inline annotations can downgrade individual claims.

## 2. The five questions every deep note answers

1. **What is the topic?** One sentence, concrete.
2. **What is verified?** What the cited sources or experiments clearly support.
3. **What is uncertain?** What remains to be confirmed and why it matters.
4. **Why does this matter?** What decision or workflow depends on it.
5. **What consequence follows?** Script, tool, template, or principle implication.

If a note has no answer to question 5, it is probably describing rather than concluding. That is legitimate for reference material but not for principles or research.

## 3. Separate fact from implication

Inside a note:

- **Verified** — what the evidence directly supports.
- **Implication** — what probably follows for design or workflow.
- **Risk** — what might still go wrong.
- **Action** — what to do differently in scripts, memory setup, or performance workflow.

## 4. Edge cases are first-class

For every topic where edge cases plausibly matter, ask:

- What happens when the memory slot is empty (no WAV recorded)?
- What happens when the pedal loses power mid-recording?
- What happens when connected via USB while BOSS Tone Studio is also running?
- What happens when you import a WAV that is not 44.1 kHz / 32-bit / stereo?
- What happens when all 16 ASSIGN slots are used?
- What happens when you connect two RC-600 units together?
- What happens after factory reset (MEMORY only vs SYSTEM only vs full)?
- What happens when firmware is updated with memories already written?
- What happens on macOS vs Windows regarding ROLAND drive mounting?
- What happens when a .RC0 file is edited externally and reimported?

A note that ignores these when they apply is incomplete.

## 5. Confidence discipline

| Level | When to use |
| --- | --- |
| high | `evidence: official` or `evidence: experiment` with direct support |
| medium | Evidence is strong but version-sensitive or partial |
| low | Mostly inference; would benefit from direct hardware validation |

`confidence: high` with `evidence: inference` is a lint error.

## 6. Experiments before claims

An experiment has the shape:

- **Hypothesis** — what we expect to observe and why.
- **Method** — steps concrete enough that another person can reproduce on real hardware.
- **Capture** — what data to record (file contents, MIDI log, display state, file sizes).
- **Expected result** — the outcome that would confirm the hypothesis.
- **Alternative outcomes** — what other outcomes mean.

Experiments live in `experiments/<nn-slug>/`. The `SPEC.md` is written before running; `results/` is populated when running; `RUNLOG.md` captures the specific hardware, firmware version, and OS.

Until `results/` contains data, any note that references the experiment must cite it as `evidence: inference`, not `evidence: experiment`.

## 7. Source, inference, and the boundary

- The frontmatter linter fails any note with `evidence: experiment` whose `experiment_path` does not resolve.
- Cross-references to files, memory examples, or scripts that do not yet exist use the tag `planned:` rather than presenting them as existing.
- "We have a script that does..." is only a valid sentence when that script exists at a specific path in this repo.

## 8. Version sensitivity

Target firmware: **RC-600 v1.50**.

- Reference facts are tagged `verified_in: "1.50"`.
- Features introduced in later firmware use `available_since: "x.xx"`.
- If firmware version for a behavior is unknown, mark it `firmware_version: unknown` and add an open research question.

## 9. Hardware realism

When a note discusses RC-600 memory or workflow design, consider:

- ASSIGN budget: 16 slots per memory.
- Save/recall: does the parameter persist after power cycle?
- USB storage mode vs MIDI mode: the pedal cannot do both simultaneously.
- WAV constraints: 32-bit float, 44.1 kHz, stereo, 512 kB-pad multiple.
- On-device naming: 12-character limit.
- Memory count: 99 slots total.

## 10. What to avoid

- Undocumented claims presented as fact.
- Summaries of official docs with no added judgment.
- Phantom references: scripts, files, or experiments that do not exist in this repo.
- Multiple files on the same topic that do not cross-reference.

## 11. What success looks like

A good artifact in this repo helps a future AI or human do at least one of these better:

- reason more accurately about RC-600 behavior or limitations,
- build memory setups faster and more correctly,
- debug unexpected pedal behavior,
- design AI-assisted workflow tools grounded in the real device,
- preserve workflow integrity across firmware updates.
