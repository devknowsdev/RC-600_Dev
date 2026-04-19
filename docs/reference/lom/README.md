---
id: ref-lom-readme
title: LOM reference — structure and schema
surface: liveapi
live_version: "12.1"
max_version: "8.6"
evidence: official
confidence: high
source: "https://docs.cycling74.com/apiref/lom/"
last_verified: 2026-04-19
---

# LOM reference

One YAML file per Live Object Model object. Precise per-object facts go here;
narrative guidance and patterns live in the sibling cheatsheets.

## Why YAML

So an AI reading this repo can reason over structured data without parsing
prose. Fields are consistent across objects, values are typed, and cross-
references use stable `id` fields.

## Version anchoring

These files describe the LOM as of **Max 8 / Live 12.1**, which is the target
stack for this repo. The Max 8 LOM documentation (and Cycling '74's
`apiref/lom/` site) is the source. When a property or method was introduced
after 12.1, it carries an `available_since` field.

The current `apiref/lom/` pages at cycling74.com describe Live 12.3.5; the Max
8 legacy page describes Live 12.1. These files follow the Max 8 legacy page
where they differ, with 12.2+ and 12.3+ additions flagged.

## Schema

```yaml
id: ref-lom-objectname        # stable cross-reference id (kebab-case slug)
object: ObjectName            # LOM class name
canonical_path: "..."         # or null for types reachable only via another object
summary: "..."                # one-line description from the LOM
source_url: "https://..."     # direct link to the LOM page (official evidence anchor)
verified_in: "12.1"           # Live version used when reconciling Max 8 vs current apiref
evidence: official            # repo standard: official for apiref-backed entries
confidence: high
last_verified: YYYY-MM-DD     # when this file was last checked against source_url

children:                     # list child or single-child references
  - name: children_name
    type: Type                # a LOM class name
    cardinality: list | one   # "list" means indexable; "one" means scalar child
    access: [read, observe]   # read, write, observe — which apply
    notes: "..."              # optional gotchas
    available_since: "12.0"   # optional

properties:
  - name: propname
    type: bool | int | float | symbol | unicode | dictionary | list | ...
    access: [read, write, observe]
    notes: "..."              # optional
    available_since: "..."    # optional

functions:
  - name: methodname
    params:                   # empty list if none
      - name: paramname
        type: int
        optional: false
    returns: "..."            # or null
    notes: "..."
    available_since: "..."

available_since: "12.0"       # optional, for the whole class
track_type_restrictions:      # optional — e.g. "master only"
  - "..."
```

## Files in this directory

Present YAML objects (this repo):

- **Core:** `application.yaml`, `clip.yaml`, `clipslot.yaml`, `device.yaml`, `deviceparameter.yaml`, `mixerdevice.yaml`, `scene.yaml`, `song.yaml`, `song-view.yaml`, `this-device.yaml`, `track.yaml`, `track-view.yaml`
- **Devices / racks:** `controlsurface.yaml`, `drumpad.yaml`, `plugindevice.yaml`, `rackdevice.yaml`, `chain.yaml`

Planned YAML stubs (not in repo yet; use Cycling ’74 apiref until added):

- **Newer / advanced:** `takelane.yaml` (Live 11+), `groove.yaml`, `groovepool.yaml` (Live 11+), `tuningsystem.yaml` (Live 12+), `cuepoint.yaml`, `application-view.yaml`, `chainmixerdevice.yaml`, `drumchain.yaml`, `maxdevice.yaml`
- **Device-specific** (extend `Device`; see official LOM as canonical): `simplerdevice.yaml`, `wavetabledevice.yaml`, `compressordevice.yaml`, `eq8device.yaml`, `driftdevice.yaml`, `drumcelldevice.yaml`, `hybridreverbdevice.yaml`, `looperdevice.yaml`, `melddevice.yaml`, `roardevice.yaml`, `shifterdevice.yaml`, `spectralresonatordevice.yaml`, `sample.yaml`

(These extend `Device` with per-device-type parameter names. For most
tooling, use the Device interface; only consult these when you need
device-specific macros or child collections.)
