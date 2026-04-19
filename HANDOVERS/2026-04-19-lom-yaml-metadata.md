# 2026-04-19 — LOM YAML evidence metadata and README accuracy

## What was done
- Read the latest handover (`2026-04-19-gpt-docs-lom-verification.md`), which had routed LOM verification but not yet applied file-level changes.
- Added `evidence: official`, `confidence: high`, and `last_verified: 2026-04-19` to all seventeen files in `docs/reference/lom/*.yaml`, immediately after `verified_in: "12.1"`. Official anchoring remains the existing `source_url` field (Cycling ’74 `apiref/lom/` URLs); spot-checked HTTP 200 on representative URLs.
- Updated `docs/reference/lom/README.md`: schema example now documents `id` and the new evidence fields; replaced the “Files in this directory” section so it lists only YAML files that exist in the repo and moved not-yet-written stubs to an explicit **Planned** list (fixes phantom file references under `AGENTS.md` §4.3). Bumped README frontmatter `last_verified` to `2026-04-19`.

## What is unfinished
- Deep line-by-line verification of each YAML object against the current `apiref/lom/` pages (property renames, `available_since`, and notes) was not repeated in full; only structural metadata and inventory accuracy were addressed.
- `STATE.md` priority #1 (“GPT verification passes”) is only partially satisfied; a follow-up pass should diff YAML content against official docs and record any factual deltas.

## Decisions made
- **`source` vs `source_url`:** Left `source_url` as the single URL field on LOM YAML objects; `evidence: official` is justified by that field, matching existing repo pattern. No duplicate `source:` key added to avoid two sources of truth.
- **README edit:** Allowed because the prior README listed multiple `.yaml` paths that did not exist, which violates the repo’s no-phantom-references rule; the fix is tightly scoped to the LOM reference area.

## Open issues
- Stub objects named in README (`takelane`, `groove`, device-specific types, etc.) still have no YAML files; when added, they should follow the same header metadata pattern.
- Eval harness (`tests/eval/`) and Live experiment runs remain next per `STATE.md`.

## Suggested next route
→ ROUTE:GPT — systematic diff of each `docs/reference/lom/*.yaml` against the matching `docs.cycling74.com/apiref/lom/` page; update entries where the live docs diverge from our Max 8 / Live 12.1 baseline and refresh `last_verified` where touched.
