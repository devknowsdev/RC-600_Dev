---
id: exp-01-rc0-schema-capture
title: Experiment 01 — RC0 Schema Capture
surface: experiment
evidence: inference
confidence: medium
last_verified: 2026-04-20
---

# Experiment 01 — RC0 Schema Capture

## Status

**Not yet run.** Awaiting a real `MEMORY01A.RC0` file from the pedal.

## Hypothesis

The `.RC0` files stored in `ROLAND/DATA/` on the RC-600's USB drive are XML documents. The element names and nesting structure correspond to the parameter sections in the RC-600 Parameter Guide.

This follows from:
- rc600editor.com referring to editing "the actual loppers xml files"
- The RC-500 / RC-505 community establishing XML as the storage format for related products
- RC-Editor changelog referencing external XML editor support

`evidence: inference` until a real file is inspected.

## Method

1. Power off the RC-600.
2. Put into USB Storage mode: navigate to `MENU → USB → Storage` (or hold `[MENU]` while powering on — verify against Owner's Manual).
3. Connect USB-B to Mac.
4. Confirm the `ROLAND` volume mounts in Finder.
5. Navigate to `ROLAND/DATA/`.
6. Record all filenames and sizes present.
7. Copy `MEMORY01A.RC0` (use a customised memory for more interesting data).
8. Copy `MEMORY01B.RC0` if it exists.
9. Copy the system file (name unknown — document whatever is present).
10. Open `MEMORY01A.RC0` in a plain text editor. Confirm XML or binary.
11. If XML: record root element, direct children, tree to at least 3 levels deep.
12. Upload all captured files to `experiments/01-rc0-schema-capture/results/`.

## Capture

Record in `results/RUNLOG.md`:
- Firmware version shown at device startup
- macOS version
- Whether file is readable text or binary
- Root element name (if XML)
- File size of `MEMORY01A.RC0`
- Whether `MEMORY01B.RC0` exists and its size vs A variant
- Full listing of all files in `ROLAND/DATA/`
- First 60 lines of `MEMORY01A.RC0`

## Expected result

File is XML. Root element contains children corresponding to Parameter Guide sections: track settings, rhythm, assign/control, input FX, track FX, MIDI settings, system. Element names map to the Parameter Guide.

## Alternative outcomes

**Binary file:** Note magic bytes and size. This would constrain the authoring surface significantly. The RC-Editor codebase (`paulelong/RCEditor`, open source) would be the primary decoding reference.

**XML with opaque codes:** Extractable but requires a lookup table. Same reference.

**A/B files serve different purposes:** Document the actual relationship. Working hypothesis: A=active, B=previous write (swap buffer) — but this is `evidence: inference`.

## Deliverable

After running, produce `results/rc0-structure.yaml` — element tree skeleton (names and nesting only, no values). Update this SPEC's frontmatter to `evidence: experiment` once results exist.
