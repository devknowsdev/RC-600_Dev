# External reference index

This repo does not mirror official docs. It links to them. This file is
the curated index of external official sources.

## Core — Live API and LOM

| Source | URL | Notes |
| --- | --- | --- |
| Live Object Model (Max 9 / current) | https://docs.cycling74.com/apiref/lom/ | Current LOM, references Live 12.3.5 |
| Live Object Model (Max 8 / our target) | https://docs.cycling74.com/legacy/max8/vignettes/live_object_model | Anchored to Live 12.1 |
| Live API Overview | https://docs.cycling74.com/userguide/m4l/live_api/ | Conceptual overview |
| LiveAPI JavaScript object (Max 8) | https://docs.cycling74.com/legacy/max8/vignettes/jsliveapi | JS-side reference |
| Node for Max API | https://docs.cycling74.com/apiref/nodeformax/ | Node bridge reference |

## Core — Max for Live authoring

| Source | URL | Notes |
| --- | --- | --- |
| Building Max Devices | (Ableton site — search current URL) | Ableton's M4L production pack |
| Max for Live Production Guidelines | (Ableton developer portal) | The canonical device-quality reference. Access may require developer portal registration. |
| Ableton `maxdevtools` | https://github.com/Ableton/maxdevtools | Ableton's own M4L dev tools |

## Integration

| Source | URL | Notes |
| --- | --- | --- |
| Installing third-party remote scripts | https://help.ableton.com/hc/en-us/articles/209072009 | Official help article |
| Push User Manual | https://www.ableton.com/en/manual/push/ | Push 2/3 user manual |
| Ableton Link GitHub | https://github.com/AbletonAg/link | Header-only sync library |

## Advanced / optional

| Source | URL | Notes |
| --- | --- | --- |
| Ableton Plugin Developer Portal | (requires application) | External plugin validation |
| Live Set Export (ALSExportKit) | (Ableton developer docs) | iOS export use case |
| Max 8 full documentation | https://docs.cycling74.com/legacy/max8/ | Legacy Max 8 reference |
| Max current documentation | https://docs.cycling74.com/ | Max 9 / current |

## Community resources (use with caution)

These are not official. Treat any claim from them as `evidence: inference`
unless you can cross-reference against an official source.

| Source | URL | Notes |
| --- | --- | --- |
| Cycling '74 Forums | https://cycling74.com/forums | M4L community |
| Ableton Forum | https://forum.ableton.com/ | General Ableton |
| Adam Murray's Live API guide | https://adammurray.link/max-for-live/js-in-live/live-api/ | Excellent JS tutorial, not official |
| AbletonOSC | https://github.com/ideoforms/AbletonOSC | OSC bridge, research-grade |

## Usage rule

When citing an external source in a repo note, use the **`source:` field
in YAML frontmatter** with a specific URL. Don't just say "the Ableton
docs say..." — give a clickable link.

If a URL goes dead, downgrade the referencing note's `evidence` to
`inference` until re-sourced.
