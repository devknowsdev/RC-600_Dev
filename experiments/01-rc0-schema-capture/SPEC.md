---
id: exp-01-rc0-schema-capture
title: Experiment 01 — RC0 Schema Capture
surface: experiment
evidence: experiment
experiment_path: experiments/01-rc0-schema-capture
confidence: medium
last_verified: 2026-04-20
---

# Experiment 01 — RC0 Schema Capture

## Status

**Run 2026-04-20.** Files uploaded to Claude project, read via project knowledge search.
See `results/RUNLOG.md` for full findings and method deviation notes.

## Hypothesis

The `.RC0` files stored in `ROLAND/DATA/` on the RC-600's USB drive are XML documents.

**Result: CONFIRMED.** All four uploaded files (`MEMORY001A_RC0.xml`, `MEMORY001B_RC0.xml`, `SYSTEM1_RC0.xml`, `RHYTHM_RC0.xml`) are valid UTF-8 XML.

## Key findings

1. **Root structure:** `<database name="RC-600" revision="0"><mem id="0">...</mem></database>`

2. **Opaque field encoding:** Parameter values use single-letter child elements (A, B, C...) with numeric values. No human-readable parameter names in the XML. A lookup table is required to decode field meanings.

3. **Top-level element categories confirmed:**
   - Memory name (`<n>`, ASCII-encoded, 12 chars)
   - Tracks 1–6 (`<TRACK1>`–`<TRACK6>`, 25 fields each)
   - Master, REC, PLAY, RHYTHM settings
   - Internal CTL: 2 layers × 5 tracks × 2 targets + 3 layers × 9 pedals
   - External CTL: CTL1–4 and EXP1–2
   - All 16 ASSIGN slots (`<ASSIGN1>`–`<ASSIGN16>`, 10 fields each)
   - INPUT, ROUTING, MIXER
   - EQ per input (EQ_MIC1, EQ_MIC2, EQ_INST1L seen; full list unknown)

4. **A/B files:** Both variants have identical structure with different values — consistent with swap-buffer hypothesis.

5. **Input/Track FX storage location:** Not identified in these files. Requires further inspection.

## Deliverables

- `results/RUNLOG.md` — full run log with findings
- `results/rc0-structure.yaml` — element tree skeleton

## Open items

- Single-letter field lookup table (requires RC-Editor source cross-reference)
- Full EQ element list
- Input FX and Track FX storage location
- Physical drive mount observation (file sizes, full DATA/ listing)
- SYSTEM1_RC0 and RHYTHM_RC0 full inspection
