# Experiment [NN]: [Title]

> Template. Copy this directory and rename to the next experiment slug
> (`NN-short-slug`). Fill in before running. `results/` stays empty until
> the experiment is run on real Live + Max.

## Hypothesis

State what you expect to observe and why, in one paragraph. Be concrete
enough to be wrong.

## Why this matters

Which note(s) will this experiment upgrade from `evidence: inference` to
`evidence: experiment`? What product decision depends on the outcome?

## Target environment

- Live version: (e.g. 12.1.25)
- Max version: (e.g. 8.6.4)
- OS + architecture: (e.g. macOS 14.5 arm64)
- Hardware: (e.g. M1 MacBook Pro; Push 3 Standalone)

Record the exact versions the experiment was run against. If the result
is version-specific, note that.

## Setup

Steps to prepare the test. Include:

- Any `.als` file in this directory that should be opened.
- Any devices to add and how to configure them.
- Any patches, scripts, or observer-state to prepare.

Reference files should live in `assets/` inside this experiment's
directory. Keep them small and committed to git.

## Method

Numbered steps. Concrete enough that another person can reproduce
without asking for clarification. Include the exact user actions, the
exact API calls, and the exact UI state at each step.

## Measurement

What to capture. For each measurement, state:

- The signal (what we're measuring).
- The instrument (how we're measuring it — Max console, CPU meter,
  `Log.txt` tail, screenshot, `.als` diff).
- The recording format (where it goes in `results/`).

## Expected outcomes

State the specific outcome that would confirm the hypothesis.

Also state the alternative outcomes and what each would mean:

- Outcome A → hypothesis confirmed; consequence X.
- Outcome B → hypothesis falsified in this direction; consequence Y.
- Outcome C → inconclusive; what followup is needed.

Without enumerating alternative outcomes, it's too easy to see what you
expect and miss what's actually there.

## Results

**This section lives in `results/RUNLOG.md`, not here.**

Once the experiment has been run:

1. `results/RUNLOG.md` — what was actually done, when, by whom, on
   which versions, and what was observed.
2. `results/` additional files — captured data: `.als` snapshots,
   console logs, screenshots, numerical output.
3. Update the `evidence` and `confidence` fields in any note that
   references this experiment.
4. Cross-link from the related note(s) to the specific result file.

## Cleanup

Anything to reset in the environment after running. Important when
experiments modify user preferences or install scripts.

## Variants to consider later

Open questions this experiment is deliberately NOT answering, so that
scope stays tight. Candidates for follow-up experiments.
