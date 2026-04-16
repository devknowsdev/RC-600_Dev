---
id: ref-remote-scripts-overview
title: Remote scripts (Control Surface scripts) — overview
surface: remote-script
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: medium
last_verified: 2026-04-16
related: [ref-lom-controlsurface, ref-crash-recovery]
---

# Remote scripts overview

Remote scripts (a.k.a. Control Surface scripts) are **Python** code that
runs inside Live to integrate hardware controllers and to automate
workflow. They are a separate surface from Max for Live: different
language, different lifecycle, different access patterns.

This note is a starting point. Remote-script development has significant
community knowledge but limited official documentation — much of the
Python API is discovered by reading Ableton's shipped scripts.

## Where they live

Ableton ships control-surface scripts in its application bundle:

- macOS: `/Applications/Ableton Live <ver>.app/Contents/App-Resources/MIDI Remote Scripts/`
- Windows: `C:\ProgramData\Ableton\Live <ver>\Resources\MIDI Remote Scripts\`

User-installed scripts go in Live's User Library:

- macOS: `~/Music/Ableton/User Library/Remote Scripts/<script name>/`
- Windows: `%USERPROFILE%\Documents\Ableton\User Library\Remote Scripts\<script name>\`

A script is a directory containing at least a `__init__.py` that defines
a function `create_instance(c_instance)` returning an instance of a class
derived from `ControlSurface`.

## Python version

Live bundles its own Python interpreter. The version is **Python 3** in
Live 11+ (a breaking change from Live 10's Python 2). Verify the exact
minor version against your Live — it has drifted between Live 11.0 and
Live 12.x.

You cannot `pip install` into Live's bundled Python. Third-party modules
must be vendored into the script directory.

## The base framework

The framework's core modules are in Ableton's `_Framework/`:

- `ControlSurface` — the base class your script extends.
- `SessionComponent`, `MixerComponent`, `DeviceComponent`,
  `TransportComponent` — building blocks for mapping hardware to Live.
- Control wrappers: `ButtonElement`, `EncoderElement`, `SliderElement`.

Ableton has moved toward a newer framework (`ableton.v2` and the
component_map-based approach in Push's scripts), but `_Framework`-based
scripts still work and are still the common starting pattern for
hardware integrations.

Much of the API is undocumented and has been reverse-engineered from
Ableton's own scripts. Look at `UserConfiguration.py`, the AkaiMidimix
script, the Novation scripts, and Push's own scripts for patterns.

## How a script integrates with Live

1. User selects the script in Preferences → Link / Tempo / MIDI →
   Control Surface.
2. Live instantiates the script via `create_instance(c_instance)`.
3. The `c_instance` proxy gives the script access to the live_set object,
   MIDI I/O, and schedule/logging primitives.
4. The script wires MIDI input handlers, builds components, and subscribes
   to Live state changes.
5. Unloaded when the user deselects the surface or quits Live.

## Logging

Scripts write to the same `Log.txt` as the rest of Live and Max for Live
(see `docs/reference/crash-recovery.md`). The `self.log_message(...)`
method on `ControlSurface` is the canonical way to emit diagnostic output.

Python exceptions also appear in Log.txt with a traceback.

## Hot reload

Remote scripts **do not** hot-reload. To pick up a code change, the user
must toggle the script off and on in Preferences (or restart Live for
clean state).

There are community-built helpers that auto-reload scripts on file
change; they work by watching the directory and toggling the preference.
Useful during development.

## The Live API surface from Python

Inside a remote script, the live_set object is a direct Python reference
(not a path-based proxy like Max's LiveAPI). You access properties by
attribute:

```python
song = self.song()
tempo = song.tempo
song.tempo = 120.0
song.start_playing()
```

Listeners work via `add_<property>_listener(callback)`:

```python
song.add_tempo_listener(self._on_tempo_changed)
```

Critical difference from Max: **you MUST remove listeners you added**,
or they leak and fire against dead objects. Use `remove_..._listener` in
`disconnect()`.

## Why this matters for the AI assistant goal

Three classes of work are best done as remote scripts rather than Max for
Live:

1. **Controller integration.** A hardware controller that drives Live's
   transport, mixer, and clip matrix.
2. **Workflow automation.** Keystroke-level customization of Live's
   behavior, when there's a USB-MIDI-loopback or network trigger.
3. **Diagnostic tools.** A script that dumps set state, listens to all
   changes, and logs to disk — for investigating bugs or migration
   issues. Does not require a device to be instantiated in the set.

## What's missing from this note

- Worked "hello world" remote script in `examples/remote-scripts/`.
- Compatibility notes for the specific Python version in Live 12.x.
- A reference note on the `ableton.v2` framework vs legacy `_Framework`.

## References

- NSUSpray's remote-script collection (community): key reference.
- Julien Bayle's Live API guide (pre-dates LOM 12.x but core is stable).
- `ControlSurface` and `_Framework` sources inside the Live app bundle —
  read these directly; they're the documentation.
- Ableton's official article: "Installing third-party remote scripts"
  https://help.ableton.com/hc/en-us/articles/209072009
