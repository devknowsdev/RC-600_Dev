# STATE.md

Current mutable repo state. Update this file after material repo changes.

## Current priorities
1. Run GPT verification passes against existing docs and LOM YAMLs.
2. Run the eval harness in `tests/eval/`.
3. Run the existing Live/Max experiments with real captures.
4. Continue Phase 2 bridge work, especially the interface spec and implementation scaffolds.
5. Expand reference coverage where the repo still has thin spots.

## Current notes
- LOM YAML files under `docs/reference/lom/` now include `evidence`, `confidence`, and `last_verified` (see latest handover in `HANDOVERS/`).
- Canonical instructions live in `AGENTS.md`.
- Repository methodology lives in `docs/_meta/METHODOLOGY.md`.
- `HANDOVERS/` is the session-to-session coordination layer.
- Update this file when priorities or repo state materially change.
