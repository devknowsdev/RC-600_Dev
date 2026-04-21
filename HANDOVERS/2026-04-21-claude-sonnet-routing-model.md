# HANDOVER - Claude Sonnet - 2026-04-21 (session 2)

## Session summary

Routing topology model: first slice. Moved the project from flat parameter editor toward routing-aware memory model.

## What was done

### Architecture assessment

Conducted a full project assessment against the deep-research article about RC-600 architecture. Key finding: the project is directionally sound but at a crossroads. The current flat parameter editor is correct as a foundation, but the RC-600's defining characteristic is that it's a routing/control/memory system, not a simple track editor. Identified three modeling priorities: (1) routing topology, (2) assign/control graph, (3) system-vs-memory preference split.

### Routing model implementation (PR #10)

1. Added `routing_track` section to `docs/reference/v1-memory-model.yaml` with 4 fields per track (MAIN, SUB1, SUB2, PHONES), all `evidence: official` from Parameter Guide p. 11.

2. Extended `CanonicalMemoryState` with `trackRouting: SectionState[]` (6 entries, one per track). Factory default is all outputs ON.

3. Updated `buildMemorySummary` to surface routing configuration. Routing lines appear first in the summary (before track behaviors) because routing frames the memory's purpose. Only shows when routing differs from factory default (all-on).

4. Created `TrackRoutingSection.tsx` - a compact matrix component (rows = tracks, columns = output buses). Intentionally NOT using FieldRenderer because routing is better shown as a matrix than as individual field rows.

5. Updated `MemoryEditorScreen.tsx` to wire routing section and state. Placed routing section immediately after Memory Name, before Tracks, because routing context should be established before per-track parameters.

6. Added routing-related open questions and experiment priorities to the schema.

### Summary panel expansion

Also added rec/play/rhythm summary lines to `buildMemorySummary` (from the prior summary audit). The summary now covers all six sections: routing, tracks, record, playback, rhythm, and name.

## What is unfinished

- Input/rhythm routing (separate section in the Parameter Guide, next routing slice)
- PHONES OUT mode (system-level, determines whether PHONES is independent or mirrors another bus)
- STEREO LINK (system-level, determines L/R independence)
- System-vs-memory PREFERENCE (determines whether routing is global or per-memory)
- Assign graph (the second half of the machine)
- FX bank model
- RC0 binding for routing (blocked on decoding ROUTING A-S fields)

## Decisions made

- Routing section uses a custom matrix layout instead of FieldRenderer. This is the first section that deviates from the generic pattern, and it's justified: a 6x4 checkbox grid is fundamentally clearer than 24 individual field rows.
- Routing appears in the editor BEFORE tracks, because routing frames the memory's purpose.
- Factory default for routing is all-ON (all tracks to all buses). Summary only shows routing when non-default.
- `buildMemorySummary` now shows routing first, then tracks, then rec/play/rhythm. This matches the article's mental model: understand the routing topology before individual parameters.

## Evidence status

- `routing_track` section: `evidence: official`, `confidence: medium` - parameter names and values directly from Parameter Guide p. 11
- XML field mapping: `mapping_status: unknown` - the ROUTING element has 19 opaque fields (A-S), bitmask encoding hypothesized but not confirmed
- PREFERENCE interaction: `evidence: open` - unclear whether memory files store routing values when PREFERENCE=SYSTEM

## Open questions added to schema

- Which ROUTING fields (A-S) map to per-track output assignment?
- Are ROUTING fields bitmask-packed (6 tracks per field) or individual?
- Does PREFERENCE=MEMORY cause routing values to be stored in MEMORYxxA.RC0?

## Next actions

-> ROUTE:HUMAN - Review and merge PR #10
-> ROUTE:HUMAN - Test that routing matrix renders correctly and summary updates when routing is changed
-> ROUTE:SONNET (next session) - Input/rhythm routing section (next routing slice)
-> ROUTE:SONNET (next session) - Build ROUTING field decode experiment from RC-Editor source cross-reference
-> ROUTE:GPT (extractor) - Continue parameter YAML extraction from Parameter Guide
-> ROUTE:GPT (auditor) - Review track.yaml output if available

## Files changed in this PR

- `docs/reference/v1-memory-model.yaml` - added routing_track section, updated ui_v1 and open_questions
- `apps/rc600-mac-ui/src/features/memory-summary/buildMemorySummary.ts` - added trackRouting to canonical state, routing/rec/play/rhythm summary lines
- `apps/rc600-mac-ui/src/features/memory-editor/MemoryEditorScreen.tsx` - wired routing section and state
- `apps/rc600-mac-ui/src/features/memory-editor/sections/TrackRoutingSection.tsx` - NEW, matrix component
