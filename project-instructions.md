# Project Instructions — ableton_dev

These instructions govern all AI sessions working on this repository, regardless of model (Claude Opus, Claude Sonnet, GPT-4o, or others). They define the working standards, the routing protocol between models, and the handover format that ensures continuity across sessions.

---

## 1. What this project is

A knowledge and tooling repository for evolving an AI into an expert-level Ableton Live development assistant. The repo contains structured reference material (LOM YAMLs, cheatsheets, principles), experiment specifications, evaluation harnesses, and will eventually contain a copilot bridge layer (MCP server + Node for Max) for direct AI-to-Live interaction.

The repo's integrity standard is unusually strict: every factual claim must declare its evidence class (`official`, `experiment`, `inference`, `open`) and its confidence level. A fabricated claim is worse than a gap. See `docs/_meta/METHODOLOGY.md` for the full rules.

---

## 2. Current state (update this section after each major session)

**Version:** v0.2 (rebuilt 2026-04-16)
**Phase:** Phase 1 complete (audit + rebuild). Phase 2 (copilot architecture) not started.
**File count:** 66 files, 25 linter-clean frontmattered docs.
**Linter status:** `tools/lint-frontmatter.py` passes with 0 errors, 0 warnings.
**Experiments run:** 0 of 3 specs. All `results/` folders empty.
**Eval harness run:** Not yet. 20 questions defined in `tests/eval/questions.md`.
**GPT verification:** Pending. Prompts delivered (`gpt-review-prompt.md`, `gpt-antihallucination-prompt.md`).

**Key files to read first in any new session:**
1. `README.md`
2. `docs/_meta/METHODOLOGY.md`
3. `CHANGELOG.md`
4. `docs/adr/001-rebuild-from-v01.md`
5. `claude_handover_ableton_ai_copilot.md`

---

## 3. Roles and model routing

Different models have different strengths. Any AI working on this project should tag its output with a routing recommendation when the next step would be better handled by a different model.

### Routing tags

Place one of these at the end of any output section where the next action is better suited to a different model:

```
→ ROUTE:OPUS — [reason]
→ ROUTE:SONNET — [reason]
→ ROUTE:GPT — [reason]
→ ROUTE:HUMAN — [reason]
```

### When to use each model

**Claude Opus** — Use for:
- Architectural decisions and system design (copilot architecture, bridge specs, MCP server design).
- Deep audit and critique where judgment matters more than throughput.
- Writing normative documents (principles, methodology, ADRs) where nuance and self-skepticism are important.
- Cross-referencing multiple complex documents and synthesizing conclusions.
- Evaluating whether a piece of work meets the repo's evidence standards.
- Resolving ambiguity in the handover plan or making scoping decisions.

**Claude Sonnet** — Use for:
- Writing individual reference docs, YAML files, and experiment specs from a clear brief.
- Code generation (JS for Max, Python for tools/linters, Node for Max bridge code).
- Filling in stub documents where the structure and bibliography already exist.
- Running the evaluation harness (answering the 20 questions against repo context).
- Routine maintenance: updating frontmatter, fixing cross-references, adding new LOM objects.
- Drafting templates, test plans, and README files for new examples.

**GPT-4o** — Use for:
- Systematic fact-checking against external URLs (LOM page-by-page verification).
- Exhaustive cross-reference integrity checks (crawl every `related:` field, verify every path).
- Anti-hallucination audits (the prompts already written for this).
- Bulk data extraction from web pages (scraping the full LOM into structured form).
- Line-by-line code review against documented API specs.
- Any task that is high-volume, low-judgment, and benefits from methodical thoroughness.

**Human** — Use for:
- Running experiments in Live + Max (no AI can do this).
- Building `.maxpat` and `.amxd` files (requires Max GUI interaction).
- Testing on Push hardware.
- Making final release decisions.
- Resolving taste questions (naming, UX, creative direction).
- Pushing to git, managing GitHub issues, configuring CI.

### Routing examples

An Opus session writes a copilot architecture doc and ends with:
```
→ ROUTE:SONNET — Implement the 12 MCP tool handler functions 
  defined in the interface spec. The signatures and behaviors 
  are fully specified; this is code generation from a clear contract.
```

A Sonnet session writes 8 new LOM YAMLs and ends with:
```
→ ROUTE:GPT — Fact-check these 8 YAMLs against their official 
  LOM pages. Use the verification table format from 
  gpt-review-prompt.md Task 1.
```

A GPT session finds 14 discrepancies in the LOM YAMLs and ends with:
```
→ ROUTE:SONNET — Apply the 14 corrections from this review. 
  Each is a specific field change with the correct value cited.
```

A Sonnet session writes experiment device code and ends with:
```
→ ROUTE:HUMAN — Build these two .maxpat files in Max 8.6, 
  freeze them, and run Experiment 01 per the SPEC. Fill in 
  results/RUNLOG.md with observations.
```

---

## 4. Standards every session must follow

### 4.1 Evidence discipline

- Never assert `evidence: official` without a `source:` URL or doc reference that you have actually checked (not recalled from training data).
- Never assert `evidence: experiment` without a populated `results/` folder at the cited `experiment_path`.
- When writing from training-data memory, use `evidence: inference`. This is not a demotion — it's honesty.
- When uncertain, say so. Propose the smallest experiment that would resolve the uncertainty.

### 4.2 Frontmatter compliance

Every new or modified markdown file in `docs/`, `experiments/*/SPEC.md` must pass `tools/lint-frontmatter.py`. Run it before declaring work complete. The schema is in `docs/_meta/frontmatter-schema.md`.

### 4.3 No phantom references

Do not reference a file, experiment result, example device, or code artifact that does not exist in the repo. If you want to reference something that will exist in the future, use the word "planned" explicitly: "the planned experiment at `experiments/04-.../`" — never "the experiment at..." as though it exists now.

### 4.4 Code correctness

Every code example (JS, Python, Max message syntax) must:
- Guard for `id == 0` on any `LiveAPI` path resolution.
- Use `getcount()` before iterating list children.
- Never write to Live from inside an observer callback.
- Never create `new LiveAPI(callback)` inside an event handler (reuse and repoint).
- Use `[live.remote~]` for internal modulation, not `[live.object] set value`.

If you write code that violates any of these, you are contradicting the repo's own principles. Fix it or explain why the exception is justified.

### 4.5 Version awareness

Target stack is **Live 12 + Max 8.6**. The LOM reference layer is anchored to Max 8 documentation (Live 12.1). If you document a feature introduced in a later version, tag it with `available_since`. If you're unsure when a feature was introduced, mark it and move on — don't guess.

### 4.6 Handover format

Every session must end with either:
- A **handover prompt** for the next session (specify which model), OR
- A **routing tag** on the final output section indicating what should happen next and who should do it.

The handover must include:
1. What was done in this session (specific files created/modified).
2. What is unfinished (with specific next steps, not vague TODOs).
3. Any decisions made that the next session needs to know.
4. Any issues discovered that are not yet resolved.

---

## 5. Repository structure (canonical)

```
ableton_dev/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CHANGELOG.md
├── .gitignore
├── docs/
│   ├── _meta/              Methodology, frontmatter schema
│   ├── adr/                Architectural Decision Records
│   ├── curriculum/         Staged learning path
│   ├── principles/         Normative guidance (how we do things)
│   ├── reference/          Platform facts (verified against official docs)
│   │   └── lom/            One YAML per LOM object
│   └── research/           Open questions, case studies
├── examples/
│   ├── m4l/                Max for Live example devices
│   ├── liveapi-js/         Standalone JS examples
│   └── remote-scripts/     Python remote script examples
├── experiments/            Experiment specs + results
│   ├── _template/
│   ├── 01-undo-flood-reproducer/
│   ├── 02-parameter-rename-migration/
│   └── 03-observer-rebind-stress/
├── prompts/                AI assistant system prompts
├── reference/              External docs index (links only)
├── templates/              Starting-point templates
├── tests/eval/             Evaluation question bank + rubrics
└── tools/                  Linters, audit scripts
```

Do not create files outside this structure without first writing an ADR in `docs/adr/` explaining why.

---

## 6. What NOT to do

- Do not add methodology documents. `METHODOLOGY.md` exists. If the methodology needs changing, modify it — don't create a parallel document.
- Do not restate principles in new files. Cross-reference the existing principles docs.
- Do not create abstraction layers over abstraction layers. If a concept needs explaining, explain it in the relevant reference or principle doc.
- Do not optimize for word count. A 200-line doc that answers its five questions is better than a 2000-line doc that restates the same point from multiple angles.
- Do not claim work is complete without running the linter.
- Do not hallucinate. When in doubt, say "I don't know — here's how to find out."

---

## 7. Priority stack (current)

In descending order of leverage:

1. **Run GPT verification passes** (prompts already written). Fix what they find.
2. **Run the eval harness** (`tests/eval/questions.md`) — score the repo's answering capability.
3. **Run Experiment 01** (requires human with Live + Max).
4. **Write `docs/copilot-architecture-v1.md`** — MCP-first design for the Live bridge.
5. **Write `docs/bridge-interface-spec.md`** — MCP tool definitions.
6. **Build the Node for Max bridge** — first working prototype.
7. **Fill remaining stubs** (MIDI Tools, Push integration — after experiments provide data).
8. **Expand LOM coverage** — device-specific objects (SimplerDevice, WavetableDevice, etc.).

Update this list as items are completed.
