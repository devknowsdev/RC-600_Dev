---
id: ref-als-file-format
title: Live Set (.als) file format — primer
surface: packaging
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: low
last_verified: 2026-04-16
related: [ref-packaging, principle-release-discipline]
---

# Live Set (.als) file format

Live Sets and related files are **gzip-compressed XML**. This is leverage:
any `.als` can be decompressed and inspected as plain text, which unlocks
tooling opportunities the previous version of this repo didn't acknowledge.

This file is a primer — enough to orient, with references for going deeper.
It is `evidence: inference` with `confidence: low` because most of this is
community knowledge rather than officially-documented spec. Treat anything
here as a starting point for experimentation, not as guaranteed stable.

## The file-type family

| Extension | Contents |
| --- | --- |
| `.als` | Full Live Set |
| `.alc` | Live Clip (Session clip with metadata) |
| `.adv` | Preset (device state) |
| `.adg` | Device Rack / Instrument Rack preset |
| `.alp` | Live Pack (archive format for distribution) |
| `.amxd` | Max for Live device |
| `.amxd` (frozen) | Max for Live device with its dependencies embedded |

All of `.als`, `.alc`, `.adv`, `.adg` are gzipped XML. `.alp` is a custom
archive. `.amxd` is a Max patcher format (JSON at the core, with Live-specific
wrapping).

## Quick inspection

```bash
# macOS / Linux
gunzip -c MySet.als > MySet.xml

# or in Python
import gzip
with gzip.open('MySet.als') as f:
    xml = f.read()
```

The XML root element is `<Ableton>` with a `MajorVersion`, `MinorVersion`,
`SchemaChangeCount`, and `Creator` attribute. The document contains the set's
entire structure — tracks, clips, devices, automation envelopes, automation
lanes, view state, and more.

## What becomes possible

- **Diff-friendly set analysis.** Two saved versions of the same set can be
  compared structurally. Useful for debugging "what changed when this broke."
- **Offline parameter migration audits.** Scan all `.adg`/`.adv` files for a
  device to detect parameter-identity changes before shipping an update.
  (See `docs/principles/parameter-identity.md`.)
- **Fleet scanning.** For a user with many sets, programmatically locate
  which ones reference a given device, a given plug-in path, or a missing
  sample.
- **Corruption recovery.** Partially-corrupt sets can sometimes be opened in
  an editor, trimmed to the surviving portions, re-gzipped, and reopened.
- **Set-migration tooling.** Converting between Live versions, stripping out
  features unsupported in an older target.

## What you should NOT do

- **Do not write to a user's `.als` file in place.** Always work on copies.
  Live set files are version-sensitive and fragile; a mis-written byte
  breaks the whole set.
- **Do not rely on exact element names between Live versions.** The XML
  schema is not a published API. Elements get renamed, reorganized,
  added, removed across Live major versions (and sometimes point releases).
- **Do not ship tools that parse `.als` internals as a primary feature
  without a compatibility strategy.** You will chase Live releases forever.

## Key XML regions (at a high level, subject to version drift)

- `LiveSet` — the main document wrapper.
- `Tracks` — list of `AudioTrack`, `MidiTrack`, `ReturnTrack`, `GroupTrack`.
- Each track contains `DeviceChain`, `MainSequencer`, mixer state,
  `AutomationEnvelopes`.
- `DeviceChain` / `Devices` — the device list, each device a typed XML
  element (`PluginDevice`, `Eq8`, `Compressor2`, etc.) with parameter state.
- Clips are in `ClipSlotList` (Session) or inline within track events
  (Arrangement).
- `SongMasterValues` — master track, tempo, signature, cue points.
- `ScenesList` — scenes with their color, name, tempo/signature flags.

The exact element names and nesting change. Treat any specific name as a
starting point to verify against a sample file.

## Python starter

```python
import gzip, xml.etree.ElementTree as ET

def load_als(path):
    with gzip.open(path) as f:
        tree = ET.parse(f)
    return tree

def find_all_plugins(tree):
    plugins = []
    for el in tree.iter('PluginDevice'):
        # element structure: inspect with print(ET.tostring(el)[:500])
        plugins.append(el)
    return plugins
```

## What remains uncertain

- Exact XML schema for Live 12.x at the element-by-element level. Would
  require systematic comparison of reference sets across versions.
- Whether Ableton has any official stance on parsing the format (likely:
  unofficial but tolerated for research / diagnostic use).
- Whether `.alp` archives contain more than a `.als` plus dependencies
  (samples, packs). Investigation pending.

## Experiment targets

The following experiments would raise this note's confidence:

- **Cross-version XML diff.** Save an identical set in Live 11, 12.0, 12.1,
  12.2, 12.3. Compare the resulting XML to build a rough compatibility map.
- **Parameter-name-change impact.** Take a Max for Live device, save a set
  using it, modify a parameter's Long Name, re-freeze, reopen the set.
  Inspect the XML before and after to see how the set's automation and
  mapping references resolve against the changed parameter identity.
- **Corruption recovery walkthrough.** Intentionally corrupt a region of a
  set's XML, re-gzip, attempt to open. Document what Live tolerates.

None of these are trivial; all would yield durable knowledge.

## References

- Ableton official: no schema published.
- Community knowledge: scattered across forum posts, the `openAbletonLiveSet`
  project, and several GitHub tooling attempts. Most are version-specific.
- `als-parser` and `pylive` style projects exist but vary in maintenance.
  Do not adopt without pinning a Live version.
