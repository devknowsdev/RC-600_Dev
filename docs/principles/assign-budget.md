---
id: principle-assign-budget
title: ASSIGN Budget Discipline
surface: principle
evidence: official
confidence: high
source: RC-600 Parameter Guide Ver. 1.3 (firmware 1.5)
source_section: ASSIGN section
firmware_version: "1.50"
verified_in: "1.50"
last_verified: 2026-04-20
related: [ref-assign-sources]
---

# ASSIGN Budget Discipline

## The constraint

The RC-600 provides exactly **16 ASSIGN slots per memory**. Each slot maps one source (a footswitch, MIDI CC, expression pedal, etc.) to one target (a parameter). There is no way to exceed 16 slots in a single memory.

`evidence: official` — Parameter Guide, ASSIGN section.

## Why this matters

The ASSIGN system is the primary mechanism for making the RC-600 responsive to real-time input. Effects switching, track muting, tempo nudging, rhythm control, and any other live parameter change must go through an ASSIGN slot. At 16 slots per memory, budget exhaustion is the single most common constraint hit by advanced users.

For reference: 6 tracks × 2 parameters each = 12 slots, leaving only 4 for rhythm, master, or global control.

## Design rules

1. **Count before you commit.** Before designing a memory layout, enumerate every real-time action needed and count the slots. If the count exceeds 16, something must be cut or redesigned.

2. **Prefer multi-function footswitches.** A single footswitch with short/long/double-press assignments can cover 2–3 actions in one slot. Design for this explicitly.

3. **Use MIDI PC for memory switching, not ASSIGNs.** Memory switching via MIDI Program Change does not consume ASSIGN slots. If you need more than one or two memory-navigation actions, route them through MIDI PC.

4. **Reserve slots for the most performance-critical actions.** Debug the slot count on paper first; don't discover the limit mid-gig.

5. **Document every ASSIGN in the memory's notes.** When building setups programmatically, keep a machine-readable record of slot allocation.

## Open question

Is the 16-slot limit enforced at the hardware/firmware level (i.e., the device will refuse to save a 17th ASSIGN), or is it a UI limit that file editing could circumvent? `evidence: open` — requires experiment or official confirmation.
