---
id: ref-crash-recovery
title: Crash recovery, logs, and diagnostic paths
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: medium
last_verified: 2026-04-16
related: [ref-als-file-format, principle-release-discipline]
---

# Crash recovery and diagnostic paths

When things go wrong in Live — a crash, a device that won't load, a set
that won't open — the ability to find relevant logs and recover user work
is what separates a tool that builds trust from one that doesn't. This
domain was completely absent from the previous repo. It is `evidence:
inference` because paths and behaviors drift between Live versions and
OSes; verify against your actual environment.

## User-facing recovery

**Autosave.** Live autosaves the current set periodically. If Live crashes
and restarts, it offers to recover the autosave. The autosave directory
locations (macOS / Windows, anchored to Live 12):

- macOS: `~/Library/Application Support/Ableton/Live <version>/Preferences/Undo/`
  and backup in `~/Music/Ableton/User Library/.../Backup/` relative to the
  set that crashed.
- Windows: `%APPDATA%\Ableton\Live <version>\Preferences\Undo\`
  (verify exact path on your version).

**Backup folder.** Each set directory has (or grows) a `Backup/` subfolder
containing prior saves. If a recent save is corrupt, earlier ones may open.

**Crashes folder.** Ableton generates a crash report directory when Live
crashes hard:

- macOS: `~/Library/Application Support/Ableton/Live Reports/Usage/`
  (may vary — Ableton has reorganized this across versions).
- Windows: `%APPDATA%\Ableton\Live Reports\Usage\`

## Log.txt

Max for Live devices and Live itself write to `Log.txt`. Location:

- macOS: `~/Library/Preferences/Ableton/Live <version>/Log.txt`
- Windows: `%APPDATA%\Ableton\Live <version>\Preferences\Log.txt`

This is **the** file to tail when a device misbehaves. Max `post()` output
from `[js]` objects and `[live.thisdevice]`-era errors appear here.

```bash
# macOS, tail a specific Live version's log live
tail -f "$HOME/Library/Preferences/Ableton/Live 12.1.25/Log.txt"
```

Post-mortem debugging flow when an M4L device misbehaves in a user's Live
Set:

1. Ask user for the Log.txt from their last session.
2. Look for `.amxd` names, JavaScript exceptions, and Live API errors
   around the timestamp of the misbehavior.
3. Cross-reference with the specific device version they were using.

## The Max Window

Inside Max itself (not Live), the Max Window (Console) collects output.
When debugging a device *in source form*:

- Open the device's source `.maxpat` in Max.
- Connect to Live (the device must be instantiated in a Live Set).
- `post()` calls in `[js]` and printout from `[print]` objects appear in
  the Max Window.

When the device is **frozen**, you don't have this — frozen devices don't
open the source patcher. Keep unfrozen sources around for debugging.

## Diagnostic patterns

**Minimum reproducible Live Set.** When reporting or investigating a bug,
the first step is to produce the smallest set that reproduces it. Often
this means stripping everything out except the affected device and one
track. Save that as `repro-<bug-id>.als` and commit it alongside the
investigation note in `docs/research/`.

**Freeze the environment.** Record exact versions in the investigation:

- Live version (e.g. "12.1.25")
- Max version (e.g. "8.6.4")
- OS + architecture (e.g. "macOS 14.5 arm64")
- M4L device version
- Any third-party plug-ins in the device chain

Without these, "it works on my machine" is unanswerable.

**The Python/remote-script log.** Remote scripts (Control Surface scripts)
write to the same Log.txt. Python exceptions in a remote script are
logged there.

## What's uncertain / version-sensitive

- Exact paths above drift between Live 11 and Live 12 and across
  macOS / Windows. Treat as starting points; verify on target.
- Whether the autosave recovery dialog appears in all crash scenarios
  or only some.
- The retention policy for the Backup folder — how many versions are
  kept, and for how long.

## Experiment candidate

A small experiment worth running: intentionally kill Live (`kill -9` on
macOS) while a set is open, restart, and document the exact recovery flow.
Repeat with the set containing a misbehaving M4L device to see what
appears in Log.txt after the crash.

## References

- Ableton's help article on crash reports (URL drifts; search current
  Ableton Help Center for "crash report").
- Ableton's help on autosave (search "autosave").
- Cycling '74 Max Console documentation for the Max-side view.
