# Case study: [Topic]

> Template. Use for deep-dive investigation of a specific behavior,
> edge case, or design tradeoff. Every case study must have YAML
> frontmatter conforming to `docs/_meta/frontmatter-schema.md`.

---
id: case-[topic-slug]
title: "[Topic]"
surface: [m4l | liveapi | etc.]
live_version: "12.x"
max_version: "8.6"
evidence: [official | experiment | inference | open]
confidence: [high | medium | low]
last_verified: YYYY-MM-DD
related: []
---

## Question

What exact question is this case study answering?

## Why it matters

What decision, implementation, or design depends on the answer?

## Evidence sources

- [ ] Official public source — cite:
- [ ] Repository experiment — path:
- [ ] Strong inference — derives from:
- [ ] Open question

## Verified

Only what the evidence directly supports.

## Observed behavior

If an experiment was run, describe what was observed. Include enough
context for reproduction.

## What remains uncertain

Be explicit. This is often the most valuable section.

## Likely implications

What follows for design or implementation? Keep separate from Verified.

## Fringe cases / failure modes

Ask where relevant:

- Zero targets?
- Multiple instances?
- Selection change mid-operation?
- Save/reload?
- Under automation?
- Across versions or platforms?

## Smallest useful experiment

What experiment would most reduce the remaining uncertainty?

## Recommended practice

What should code, tests, or docs do differently because of this study?

## Confidence

[ ] High — well-supported by official docs or repeated experiments
[ ] Medium — strong but incomplete or version-sensitive
[ ] Low — mostly inference; needs direct Live/Max validation

Justification:

## Follow-up tasks

-
