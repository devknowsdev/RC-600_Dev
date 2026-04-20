---
id: principle-backup-discipline
title: Backup Discipline
surface: principle
evidence: inference
confidence: high
last_verified: 2026-04-20
related: [exp-01-rc0-schema-capture]
---

# Backup Discipline

## The rule

**Always work on a copy. Never edit the live ROLAND drive directly.**

## Why

The RC-600's ROLAND drive is the device's internal storage exposed over USB. It is not a normal file system with journaling or undo. If a write is interrupted (USB disconnect, power loss, application crash mid-save), the resulting file may be corrupt and the memory unrecoverable without a factory reset.

Additionally, Boss Tone Studio and rc600editor both have known cases where file writes produce unexpected results. Working on a copy means a bad write is a recoverable error, not a data loss event.

## The backup procedure

1. Put the RC-600 into USB Storage mode.
2. Mount the ROLAND drive.
3. Copy the **entire** `ROLAND/` folder to a timestamped local directory before touching anything:
   ```
   ROLAND-backup-YYYYMMDD-HHMMSS/
   ```
4. Work on the copy.
5. When satisfied, copy back only the changed files — not the whole folder (to avoid accidentally overwriting unrelated memories).
6. Unmount cleanly before disconnecting USB.

## Frequency

- Before any programmatic or scripted write to the ROLAND drive.
- Before any firmware update.
- After building a new memory set worth keeping.
- Before factory reset.

## File integrity note

The RC-600 WAV files require a specific file size that is a multiple of 512 kB (plus a header pad). A WAV file that doesn't meet this constraint will cause the memory to behave unexpectedly. See `docs/principles/wav-format-discipline.md`.
