# AGENTS.md

Canonical instructions for AI sessions on this repository. `CLAUDE.md` and Cursor rules should point here rather than carrying separate instruction sets.

## 1. What this repo is

A knowledge and tooling repository for evolving an AI into an expert-level Ableton Live development assistant. It contains structured reference material, principles, experiment specs, an eval harness, and architecture work for a future copilot bridge.

Integrity standard: every factual claim should declare its evidence class (`official`, `experiment`, `inference`, `open`) and confidence. A fabricated claim is worse than a gap.

Read first:
1. `README.md`
2. `docs/_meta/METHODOLOGY.md`
3. `docs/_meta/STATE.md`
4. `CHANGELOG.md`
5. The most recent 1–3 files in `HANDOVERS/`, if any

## 2. Source of truth

GitHub is the source of truth. Do not rely on private chat memory when the repo can carry the state explicitly.

- `AGENTS.md` is the canonical instruction file.
- `docs/_meta/STATE.md` holds the mutable current-state snapshot.
- `HANDOVERS/` is the append-only model-to-model and session-to-session log.

Update `STATE.md` after material repo changes. Add a handover file whenever a session makes material progress or routes work onward.

## 3. Roles and routing

Use routing tags when the next step is better handled by a different model:

→ ROUTE:OPUS — [reason]
→ ROUTE:SONNET — [reason]
→ ROUTE:GPT — [reason]
→ ROUTE:HUMAN — [reason]

Suggested strengths:

- Opus — architecture, deep audit, ADRs, methodology, cross-doc synthesis.
- Sonnet — reference docs, YAMLs, experiment specs, code generation, scaffolds.
- GPT — systematic fact-checking, official-doc verification passes, anti-hallucination audits, bulk cross-reference checking.
- Human — experiments in Live/Max, `.maxpat` / `.amxd` builds, hardware testing, release decisions, GitHub admin.

If you route, leave a concrete handover in `HANDOVERS/`.

## 4. Standards every session follows

### 4.1 Evidence discipline

- Never claim `evidence: official` without a source you actually checked.
- Never claim `evidence: experiment` without a populated `results/` folder at the cited `experiment_path`.
- When writing from memory or deduction, use `evidence: inference`.
- When uncertain, say so and propose the smallest experiment that would resolve it.

### 4.2 Frontmatter compliance

Every new or modified markdown file in `docs/` and every `experiments/*/SPEC.md` must satisfy the schema in `docs/_meta/frontmatter-schema.md` and pass `tools/lint-frontmatter.py`.

### 4.3 No phantom references

Never reference a file, experiment result, example device, or code artifact that does not exist. For future work, mark it explicitly as planned.

### 4.4 Code correctness

Every code example should:
- guard `id == 0` on LiveAPI path resolution
- use `getcount()` before iterating list children
- never write to Live from inside an observer callback
- never create `new LiveAPI(callback)` inside an event handler when a reusable observer can be repointed
- use `[live.remote~]` for internal modulation rather than `[live.object] set value`

### 4.5 Version awareness

Target stack: Live 12 + Max 8.6. The LOM reference layer is anchored to Max 8 / Live 12.1 documentation. Tag later features with `available_since` when known. Do not guess ship versions.

### 4.6 Handovers

A handover should include:
1. What was done
2. What is unfinished
3. Decisions made
4. Open issues
5. Suggested next route, if relevant

## 5. Standing priorities

Check `docs/_meta/STATE.md` first; it is the authoritative current ordering. As a default:
1. Run GPT verification passes against existing docs and LOM YAMLs.
2. Run the eval harness in `tests/eval/`.
3. Run the existing Live/Max experiments with real captures.
4. Continue Phase 2 bridge work, especially the interface spec and implementation scaffolds.
5. Expand reference coverage where the repo still has thin spots.

## 6. Repository shape

Canonical structure:

ableton_dev_2/
├── AGENTS.md
├── CLAUDE.md
├── README.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE
├── HANDOVERS/
├── docs/
│   ├── _meta/
│   ├── adr/
│   ├── curriculum/
│   ├── principles/
│   ├── reference/
│   │   └── lom/
│   └── research/
├── examples/
├── experiments/
├── prompts/
├── reference/
├── tests/eval/
├── tools/
└── templates/

Avoid creating parallel methodology files or duplicate instructions unless there is a compelling reason and the existing canonical file is updated to reflect it.
