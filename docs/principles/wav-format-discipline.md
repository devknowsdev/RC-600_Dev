---
id: principle-wav-format-discipline
title: WAV Format Discipline
surface: principle
evidence: official
confidence: high
source: https://support.roland.com/hc/en-us/articles/201919599
source_section: RC-600 audio import requirements
firmware_version: "1.50"
verified_in: "1.50"
last_verified: 2026-04-20
related: [principle-backup-discipline]
---

# WAV Format Discipline

## The constraint

The RC-600 accepts WAV files in only one format:

- **Format:** WAV (not MP3, M4A, AIFF, or any other container)
- **Channels:** Stereo (2 channels)
- **Bit depth:** 32-bit float or 24-bit integer
- **Sample rate:** 44.1 kHz
- **File size:** Must be a multiple of 512 kB (the RC-600 pads files internally; externally imported files must meet this)

`evidence: official` — Roland support article + RC-Editor changelog (2024.2.5 documents the 512 kB padding requirement explicitly).

## What happens if you violate it

- Wrong format/sample rate/channels: device displays `UNSUPPORTED FILE` or `unSupportFormat`.
- Wrong file size (not 512 kB-padded): the device may load the file but silently alter the memory's tempo, or refuse to load.
- Boss Tone Studio itself was known to produce incorrectly-padded files on import (fixed in RC-Editor 2024.2.5 by auto-trimming to the correct sample count).

## Conversion

To convert an arbitrary audio file for import:
1. Load into Audacity, Logic, or any DAW.
2. Set project sample rate to 44.1 kHz.
3. Export as WAV, stereo, 32-bit float.
4. Verify file size is a multiple of 524288 bytes (512 × 1024).
5. If not, pad or trim to the nearest valid boundary.

The rc600editor.com editor handles this automatically on import. If building a custom tool, implement the same check.

## Programmatic validation rule

Any script that writes WAV files to the ROLAND drive must validate:
```python
assert file_size % (512 * 1024) == 0, f"WAV file size {file_size} is not a 512kB multiple"
```
Fail loudly — do not silently pad or truncate without logging.
