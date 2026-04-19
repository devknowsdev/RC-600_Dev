# Baseline Eval Run — GPT — 2026-04-19

## Run metadata
- Model: GPT
- Date: 2026-04-19
- Eval set: `questions-lom-adversarial.md`
- Reviewer: GPT
- Prompt: "Answer only from the repo knowledge. If something is uncertain, say so. Do not invent properties, functions, enum mappings, or paths."

## Score summary
- Total: 32 / 32
- Threshold band: strong and safe

## Per-question scoring

| Question | Score | Notes | Failure tags |
|---|---:|---|---|
| Q1 | 2 | Correctly rejected `Track.volume`; routed to `mixer_device volume`. | |
| Q2 | 2 | Correctly required `has_clip` or `clip.id == 0` guard. | |
| Q3 | 2 | Corrected path to `live_set view selected_track view selected_device`. | |
| Q4 | 2 | Distinguished numeric `value` from UI-facing `display_value`. | |
| Q5 | 2 | Correctly separated Chain `devices` from `mixer_device`. | |
| Q6 | 2 | Avoided overclaiming exact `playing_status` enum mapping. | |
| Q7 | 2 | Distinguished pad index space from child-list traversal. | |
| Q8 | 2 | Correctly required waiting for `live.thisdevice`. | |
| Q9 | 2 | Preferred `this_device` for self-reference and stable identity. | |
| Q10 | 2 | Correctly kept LiveAPI ownership out of Node for Max. | |
| Q11 | 2 | Distinguished `class_name`, `class_display_name`, and `name`. | |
| Q12 | 2 | Guarded `control_surfaces N` with possible `id == 0`. | |
| Q13 | 2 | Distinguished track-local selected device from appointed device. | |
| Q14 | 2 | Used `live_app` version getters rather than heuristics. | |
| Q15 | 2 | Avoided overgeneralizing loop-marker units. | |
| Q16 | 2 | Correctly separated official fact from plausible inference. | |

## Major failures
- None in this baseline run.

## Improvements needed
- Add a non-GPT baseline later for comparison.
- Add at least one eval set focused on bridge/MCP design once those docs exist.
- Consider a future rubric for partial credit on overly vague but safe answers.

## Notes
This baseline establishes the intended safety and grounding standard for future models tested against the repo. A lower-scoring model should be analyzed using the failure tags in `failure-patterns.md`.
