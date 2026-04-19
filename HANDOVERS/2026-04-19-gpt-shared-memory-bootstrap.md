# 2026-04-19 — GPT — shared-memory bootstrap

## What was done
- Added `AGENTS.md` as the canonical instruction file.
- Added `CLAUDE.md` pointing to `AGENTS.md`.
- Added `.cursorrules` pointing to `AGENTS.md`.
- Added `docs/_meta/STATE.md` as the mutable repo-state file.
- Added `HANDOVERS/README.md` documenting the handover format.

## What is unfinished
- Align `AGENTS.md` more tightly with the repo's evolving priorities as Phase 2 work continues.
- Add future handovers after material sessions.
- Keep `STATE.md` updated after significant repo changes.

## Decisions made
- GitHub is the source of truth.
- Shared instructions live in the repo, not in tool-private memory.
- `AGENTS.md` is canonical; tool-specific files should point to it.
- `HANDOVERS/` is append-only and serves as the cross-model coordination layer.

## Open issues
- The precise routing workflow between Claude, GPT, and Cursor will mature through actual use.
- Some future AGENTS guidance may need refinement as the bridge implementation takes shape.

## Suggested next route
→ ROUTE:GPT — Run a verification pass against the existing LOM YAMLs and cross-references, then record findings in a new handover.
