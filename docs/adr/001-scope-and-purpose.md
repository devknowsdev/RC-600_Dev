---
id: adr-001-scope-and-purpose
title: ADR 001 — Scope and Purpose of RC-600_Dev
surface: adr
evidence: inference
confidence: high
last_verified: 2026-04-20
---

# ADR 001 — Scope and Purpose

**Status:** Accepted
**Date:** 2026-04-20

## Context

This repository was converted from `ableton_dev_2` (an AI knowledge repo for Ableton Live + Max for Live) to target a different hardware domain: the Boss RC-600 Loop Station.

The conversion reused the structural methodology, frontmatter conventions, evidence discipline, and toolchain from `ableton_dev_2`. The Ableton-era content is being removed; the methodology and repo structure are preserved.

## Decision

`RC-600_Dev` is a knowledge and tooling repository targeting the Boss RC-600 Loop Station. It reuses the `ableton_dev_2` methodology but is content-wise independent.

## What this repo is

An evidence-disciplined reference and tooling repo for understanding and programmatically working with the Boss RC-600 Loop Station.

Target use cases:
- AI-assisted memory setup composition (building setups on Mac via .RC0 file manipulation)
- Principled reference documentation of device behavior, parameters, and constraints
- Experiment-driven verification of undocumented device behavior
- Foundation for a future Mac-side scripting / bridge layer

## What this repo is not

- A GUI editor (rc600editor.com already exists and is mature)
- A mirror of the official Boss documentation
- An Ableton/Max tooling repo (that is `ableton_dev_2`)

## The two surfaces

The RC-600 presents two distinct access surfaces:

**Authoring surface (offline):** `.RC0` XML files on the USB-mounted `ROLAND` drive. Full parameter access. Requires USB Storage mode — device unavailable for performance.

**Runtime surface (online):** MIDI Program Change (memory select, PC 0–98) and MIDI CC (assignable parameters, CC 1–31, CC 64–95). Limited to 16 ASSIGN slots per memory. No state read-back.

Most of this repo's value lives on the authoring surface.

## Consequences

- All Ableton-era content must be removed (see `docs/_meta/STATE.md` for the cleanup list)
- `evidence` discipline is identical to `ableton_dev_2`
- `live_version`/`max_version` frontmatter fields replaced by `firmware_version`
- `AGENTS.md` is the canonical instruction file
