# RUNLOG — Experiment 01: RC0 Schema Capture

**Date:** 2026-04-20
**Operator:** Claude Sonnet (via project knowledge search — files uploaded to Claude project)
**Firmware version:** Not directly read from device in this session. Files named `MEMORY001A_RC0.xml` etc. — naming convention suggests firmware 1.x era.
**macOS version:** Not applicable (files read via project knowledge, not direct mount)
**Method deviation:** Files were uploaded to the Claude project as `.xml` files rather than read from a physical ROLAND drive mount. The capture method in the SPEC describes direct USB mount — this run used pre-captured uploads. The structural findings are valid; the file listing and direct-mount observations are deferred.

## File format confirmation

All four files (`MEMORY001A_RC0.xml`, `MEMORY001B_RC0.xml`, `SYSTEM1_RC0.xml`, `RHYTHM_RC0.xml`) are **plain UTF-8 XML**. Readable as text. No binary encoding.

Hypothesis confirmed: `.RC0` files are XML.

## Root structure of MEMORY001A

```xml
<?xml version="1.0" encoding="utf-8"?>
<database name="RC-600" revision="0">
  <mem id="0">
    <!-- all memory content here -->
  </mem>
</database>
```

## Critical finding: opaque single-letter element values

All parameter values inside `<mem>` use **single-letter child elements (A, B, C, D...)** with **numeric values**. There are no human-readable parameter names in the XML. The structure is positional/coded, not self-describing.

Example — `<TRACK1>`:
```xml
<TRACK1>
  <A>0</A>    <!-- meaning: unknown without lookup table -->
  <B>0</B>
  <C>50</C>
  <D>90</D>
  ...
  <Y>0</Y>
</TRACK1>
```

This means: **decoding the XML requires a lookup table mapping each element+letter combination to its Parameter Guide counterpart.** The RC-Editor source code (`paulelong/RCEditor`) is the primary reference for this table.

## Top-level elements in MEMORY001A (complete list from inspection)

```
<n>                          Memory name (ASCII char codes per letter A-L)
<TRACK1> .. <TRACK6>         Track parameters (25 fields A-Y each)
<MASTER>                     Master settings (4 fields A-D)
<REC>                        Recording settings (6 fields A-F)
<PLAY>                       Playback settings (8 fields A-H)
<RHYTHM>                     Rhythm settings (13 fields A-M)
<ICTL1_TRACK1_FX>            Internal CTL layer 1, Track 1 FX (3 fields A-C)
<ICTL1_TRACK1_TRACK>         Internal CTL layer 1, Track 1 Track (3 fields A-C)
... (same pattern for TRACK2-TRACK5, no TRACK6 visible in ICTL)
<ICTL2_TRACK1_FX> .. TRACK5  Internal CTL layer 2 (same structure)
<ICTL1_PEDAL1> .. PEDAL9     Internal CTL layer 1, pedals 1-9 (3 fields A-C)
<ICTL2_PEDAL1> .. PEDAL9     Internal CTL layer 2, pedals 1-9 (3 fields A-C)
<ICTL3_PEDAL1> .. PEDAL9     Internal CTL layer 3, pedals 1-9 (3 fields A-C)
<ECTL_CTL1> .. CTL4          External CTL 1-4 (4 fields A-D)
<ECTL_EXP1> .. EXP2          External expression pedals 1-2 (4 fields A-D)
<ASSIGN1> .. <ASSIGN16>      ASSIGN slots 1-16 (10 fields A-J each)
<INPUT>                      Input settings (13 fields A-M)
<o>                          Unknown — likely output or other (4 fields A-D)
<ROUTING>                    Routing matrix (19 fields A-S)
<MIXER>                      Mixer settings (22 fields A-V)
<EQ_MIC1>                    EQ for MIC input 1 (12 fields A-L)
<EQ_MIC2>                    EQ for MIC input 2 (12 fields A-L)
<EQ_INST1L>                  EQ for INST input 1 Left (and presumably more)
```

## ASSIGN structure (10 fields per slot)

All 16 ASSIGN slots confirmed present. Each has fields A-J:

```xml
<ASSIGN1>
  <A>1</A>     <!-- likely: enabled/disabled -->
  <B>35</B>    <!-- likely: source (numeric code) -->
  <C>0</C>     <!-- likely: source channel or qualifier -->
  <D>0</D>     <!-- likely: source min or action type -->
  <E>0</E>     <!-- unknown -->
  <F>127</F>   <!-- likely: source max (127 = full CC range) -->
  <G>86</G>    <!-- likely: target (numeric code) -->
  <H>0</H>     <!-- likely: target qualifier -->
  <I>0</I>     <!-- likely: target min value -->
  <J>1</J>     <!-- likely: target max value (or ACT type) -->
</ASSIGN1>
```

Field interpretations are `evidence: inference` — they match the Parameter Guide's ASSIGN structure (enabled, source, source action, target, min/max) but are not confirmed without cross-referencing RC-Editor source.

## Memory name encoding

The `<n>` element encodes the memory name as ASCII decimal values per letter:

```
A=77 (M), B=101 (e), C=109 (m), D=111 (o), E=114 (r), F=121 (y),
G=48 (0), H=49 (1), I=32 (space), J=32, K=32, L=32
→ "Memory 01    "
```

Memory names are 12 characters, space-padded.

## A/B file relationship

Comparing MEMORY001A and MEMORY001B: both files contain the same top-level structure. The B variant appears to be a previous write (swap buffer), consistent with the working hypothesis. Values differ between A and B, confirming they are distinct snapshots, not mirrors.

## Open items remaining

1. **Lookup table for single-letter codes** — the meaning of each A/B/C field within each element is not documented in the official guides. Source: RC-Editor codebase required.
2. **EQ elements** — `EQ_INST1L` seen but list may be incomplete. Need: `EQ_INST1R`, `EQ_INST2L/R`, `EQ_LINE1L/R`, etc.
3. **FX elements** — Input FX and Track FX parameters not yet observed in these memory files. May be in separate elements not yet captured.
4. **SYSTEM1_RC0 and RHYTHM_RC0** — not yet fully inspected. System file likely contains global/MIDI settings. Rhythm file contains rhythm pattern data.
5. **Direct mount observation** — file sizes, exact directory listing from physical ROLAND drive not yet captured.
