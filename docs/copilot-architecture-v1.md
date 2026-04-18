---
id: copilot-arch-v1
title: "Copilot architecture v1"
surface: multi
live_version: "12.1"
max_version: "8.6"
evidence: inference
confidence: medium
last_verified: 2026-04-18
related:
  - ref-liveapi-cheatsheet
  - ref-liveapi-js-notes
  - ref-threading-and-deferral
  - ref-node-for-max
  - principle-observer-architecture
  - principle-undo-discipline
  - principle-parameter-identity
---

# Copilot architecture v1

## 1. Purpose

This document specifies the v1 architecture for an Ableton Live copilot:
a system that lets an external large language model (LLM) — in practice,
Claude — inspect and operate on a running Live Set through a narrow,
well-defined tool surface.

The document is an architecture spec, not a tutorial or a roadmap. It
names components, defines their boundaries, specifies the data flow,
states the safety rules, and commits to a concrete minimum viable slice.

Where the underlying platform constraints are verified against official
documentation, they are cited. Where a design decision is inference or
author judgment, it is labelled as such. Readers should treat those two
categories differently.

## 2. Scope and non-goals

### In scope for v1

- A running architecture that lets Claude (as an MCP client) inspect a
  Live Set through three read-only tools.
- A clear boundary between the Node for Max layer (running the MCP
  server) and the Max/JS layer (owning LiveAPI access).
- An initialization handshake that respects `live.thisdevice`.
- A safety model that prevents writes from callbacks, guards `id == 0`,
  uses `getcount` before iteration, and reuses observers rather than
  churning them.
- A naming convention that separates deterministic tools from
  selection-aware helpers.

### Explicitly out of scope for v1

- Write operations on Live state (tool calls that mutate parameters,
  create clips, fire scenes, etc.). v1 is read-only by design. Writes
  arrive in v2 once the write-safety model is ready.
- Authentication, authorization, or any multi-user trust model. v1
  assumes a single local user running Live, the copilot device, and
  Claude as MCP client on the same machine.
- Push 3 Standalone support. Node for Max has platform constraints on
  Standalone that are not yet characterized in this knowledge base.
- Ableton Link, MIDI routing, hardware control surface interaction.
- Automation writing. Even read-only access to automation envelopes is
  deferred — the LOM surface for automation requires careful treatment
  and is not a v1 concern.
- Migration/versioning of copilot-authored content in user sets. v1
  never authors content.
- Running against a remote Live instance across a network boundary.

## 3. Knowledge base and evidence basis

The architecture is grounded in the following primary sources, all
present in project knowledge:

- **LOM (Max 8 / Live 12.1) PDF** — canonical object model reference.
- **The LiveAPI Object (Max 8) PDF** — JS-side constructor, property,
  and method reference.
- **Node for Max API PDF** — `max-api` module surface.

Supporting repo material:

- `docs/reference/liveapi-cheatsheet.md` — corrected operational guide.
- `docs/reference/liveapi-js-notes.md` — JS-specific notes.
- `docs/reference/threading-and-deferral.md` — thread model.
- `docs/reference/node-for-max.md` — Node for Max primer.
- `docs/principles/observer-architecture.md` — observer discipline.
- `docs/principles/undo-discipline.md` — undo safety.
- `docs/_meta/METHODOLOGY.md` — evidence framework.

Claims in this document are classified throughout as:

- **[verified]** — directly supported by an official source or PDF
  section, with the source identifiable.
- **[inference]** — design judgment that follows from verified facts
  but is not itself stated in the sources.
- **[open]** — deliberately unresolved; see section 10.

## 4. System boundary and components

### 4.1 Topology at a glance

```
┌───────────────────────────────────────────────────────────────────┐
│                         User's workstation                         │
│                                                                    │
│  ┌────────────┐    MCP      ┌────────────────────────────────┐    │
│  │  Claude    │◄───────────►│   Copilot M4L device            │    │
│  │ (desktop / │   (stdio or │                                 │    │
│  │   web)     │    local    │  ┌──────────────────────────┐   │    │
│  └────────────┘    socket)  │  │ [node.script] runtime    │   │    │
│                             │  │  ├─ MCP server            │   │    │
│                             │  │  └─ max-api bridge module │   │    │
│                             │  └────────────┬──────────────┘   │    │
│                             │               │ max-api outlet/  │    │
│                             │               │ message in       │    │
│                             │  ┌────────────▼──────────────┐   │    │
│                             │  │ [js copilot-bridge.js]    │   │    │
│                             │  │  ├─ LiveAPI ownership     │   │    │
│                             │  │  └─ safety layer           │   │    │
│                             │  └────────────┬──────────────┘   │    │
│                             │               │ LiveAPI          │    │
│                             │  ┌────────────▼──────────────┐   │    │
│                             │  │ Ableton Live (host)       │   │    │
│                             │  └───────────────────────────┘   │    │
│                             └────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component responsibilities

**Claude (MCP client).** Issues tool calls over MCP, consumes structured
responses, composes follow-up calls. Claude has no direct knowledge of
Live; it only knows the tool surface defined in section 8.

**Copilot M4L device.** A Max for Live Audio Effect device. It hosts
the Node runtime and the JS bridge. It is a regular `.amxd` the user
loads onto any track. Its existence on a track is what grants the
copilot access to Live for that session. Closing the device terminates
the bridge.

**Node for Max runtime (`[node.script]`).** Runs a single Node.js
process colocated with the device. This process hosts:

- The MCP server, which Claude connects to.
- An `max-api` bridge module that translates incoming MCP tool calls
  into outlet messages routed to the JS bridge, and translates JS
  bridge responses back into MCP tool results.

The Node layer [verified: Node for Max API PDF] uses `max-api` with
`addHandler` for inbound messages from Max and `outlet` for outbound
messages to Max. The MCP server is a standard local MCP server; the
choice of transport (stdio vs local socket) is an implementation
detail, not an architectural one.

**JS bridge (`[js copilot-bridge.js]`).** The only component that holds
`LiveAPI` references. Every LiveAPI read goes through this module.
Every response is a structured object serialized and passed back to
Node via outlet. This module:

- Waits for `live.thisdevice` bang before allowing any LiveAPI use
  [verified: LiveAPI Object PDF, "Technical note" in Constructor section].
- Never exposes raw LiveAPI objects outside itself.
- Applies every safety rule from section 7.

**Ableton Live (host).** The environment the entire stack operates
against. Live is not a component we build; it is a hard boundary.
Our design must conform to its constraints, not negotiate them.

### 4.3 Why MCP server inside Node for Max, not alongside it

This is a design decision [inference], chosen from three plausible
options:

1. MCP server inside the Node for Max runtime (chosen).
2. MCP server as a separate local process that communicates with
   Node for Max via localhost.
3. MCP server bypassing Node for Max entirely and bridging to Live
   through some other mechanism.

Option 3 is ruled out because Node for Max is the only reasonable
local-process surface inside a Max for Live device; removing it would
require authoring a native external or using `[mxj]`/`[shell]` in ways
that are more fragile than using the documented Node bridge [inference].

Between options 1 and 2, option 1 is preferred for v1 because:

- Fewer moving parts. One process lifecycle, tied to the device.
- `max-api` already provides the in-Max communication surface
  [verified: Node for Max API PDF]. Adding a second IPC layer on top
  would be duplicate work.
- The MCP server's lifecycle matches the device's lifecycle, which is
  the correct intuition: if the device is loaded, the copilot is
  reachable; if the device is removed, the copilot is gone.

Option 2 might become preferable in the future if multiple M4L devices
need to share an MCP server, or if the MCP server needs to outlive
Live's process. Neither is a v1 concern.

## 5. Core data-flow

A single read-tool call proceeds through the following stages. The
stage boundaries are architectural; they are where safety checks and
deferral happen.

### 5.1 Stages

1. **Claude → MCP server (Node).** Claude sends a tool call over MCP.
   Request contains a tool name and parameters.

2. **Node → JS (outlet).** Node translates the request into a tagged
   list message — e.g. `["inspect_track", "call_id", "abc123", "index", 3]`
   — and outlets it toward the JS bridge. The `call_id` is a Node-side
   correlation token that lets the async round-trip complete. The Node
   layer owns request correlation; Max/JS does not.

3. **JS: initialization check.** The JS bridge refuses to process any
   request until `live.thisdevice` has fired. If a request arrives
   before initialization, JS responds with a `not_ready` result.

4. **JS: LiveAPI resolution.** JS constructs a `LiveAPI` object at the
   canonical path implied by the tool call. It checks `api.id == 0`
   before proceeding [verified: LiveAPI Object PDF, `goto` semantics;
   corroborated in cheatsheet]. If the path did not resolve, JS
   responds with a `not_found` result.

5. **JS: read.** JS calls `api.get(...)` or iterates using
   `api.getcount(...)` [verified: LiveAPI Object PDF, `getcount`
   method]. No writes happen.

6. **JS → Node (outlet).** JS serializes the structured response
   (JSON-compatible object) and sends it back through outlet, tagged
   with the same `call_id`.

7. **Node: response correlation.** Node matches the response to the
   pending request and completes the MCP tool call.

8. **MCP server → Claude.** The tool result is returned over MCP.

### 5.2 Synchrony boundaries

- **MCP transport.** Asynchronous by protocol.
- **Node ↔ Max messaging.** Asynchronous — `outlet` calls do not block
  [verified: Node for Max API PDF lists `outlet` as a fire-and-forget
  operation]. This is why request correlation lives in Node, not in
  JS.
- **JS ↔ LiveAPI.** Synchronous for `get` calls on the main thread.
  JS runs on the main (low-priority) thread [verified: threading note
  in LiveAPI Object PDF, "you cannot use the LiveAPI object in
  JavaScript global code" and the scheduler/immediate guidance in
  `threading-and-deferral.md`].

The asynchrony at the Node↔Max boundary means a single MCP tool call
might be pending for several Max-message ticks before it returns. This
is acceptable for a read-only v1. It would need a stronger model if v1
tried to coalesce multiple writes into a single undo-atomic operation.

## 6. Live-facing constraints

These are the hard constraints the design must respect. Each is
[verified] against a specific source.

**C1. LiveAPI is unavailable at JS load time.** [verified: LiveAPI
Object PDF, "Technical note" in Constructor section; `live.thisdevice`
reference.] The JS bridge must not construct a `LiveAPI` object until
`live.thisdevice` has fired. The bridge maintains a boolean
`initialized` flag and rejects all requests until it is true.

**C2. LiveAPI cannot be used on the high-priority thread.** [verified:
threading-and-deferral.md cites LiveAPI JS doc; the `immediate`
property must not be set on any function that touches LiveAPI.] The JS
bridge uses no `immediate`-flagged functions. All LiveAPI work happens
on the main thread.

**C3. Writes cannot occur inside a callback.** [verified: LiveAPI
Object PDF plus Max for Live production practice.] v1 has no writes,
so this is trivially satisfied. The architecture still encodes the
rule so v2 cannot violate it: any future mutation tool must dispatch
its write through a `Task` scheduled off the observer callback chain.

**C4. Observer registration persists.** [verified: LiveAPI Object PDF
Constructor semantics; there is no documented unregister operation.]
v1 uses no observers (no subscriptions between tool calls). If v2
introduces observers, they must be created once per lifetime of the
device and repointed via `.id`, not recreated per request.

**C5. `id == 0` is the canonical "not found" value.** [verified:
LiveAPI Object PDF, `goto` documentation: "If there is no object at
the path, id 0 is sent."] The bridge treats `id == 0` as a first-class
case. It is not an error to return "not found" — it is a valid
response that the tool surface must express clearly.

**C6. Lists are iterated with `getcount`.** [verified: LiveAPI Object
PDF, `getcount` method.] The bridge uses `api.getcount("children_name")`
before any loop, never assumes a fixed length, and never dereferences
past the returned count.

**C7. Node for Max does not own LiveAPI.** [verified: node-for-max.md
"When it's NOT the right tool: LiveAPI from Node (bridge through Max
messages instead)"; consistent with Node for Max API PDF which
describes only `max-api` Max-side communication, with no LiveAPI
surface.] The Node layer must not attempt to construct LiveAPI
objects. All LiveAPI access is through the JS bridge, addressed via
`outlet`.

**C8. Mixer parameters are DeviceParameter children of MixerDevice.**
[verified: LOM PDF, Track and MixerDevice object definitions; Track's
`mixer_device` child returns a MixerDevice, and mixer controls like
`volume` and `panning` are exposed as DeviceParameter children of
MixerDevice, not as scalar properties of Track.] Any tool that reads
mixer state must walk through the MixerDevice and read its parameter
children; it must not attempt `track.get("volume")`.

## 7. Safety model

The safety model is the concrete expression of section 6. It is
organized by who enforces what.

### 7.1 Enforced by Node

- **Single-user assumption.** Node does not attempt to distinguish
  callers. The MCP transport is local. Adding trust boundaries is a
  v2+ concern.
- **Request correlation.** Every outgoing request carries a `call_id`.
  Responses without a matching `call_id` are dropped. Requests that
  time out (e.g. 5 seconds) return a `timeout` result to the caller.
- **Rate limiting.** Node caps concurrent in-flight requests at a
  small number (e.g. 4). This is a crude but sufficient first-line
  defence against overwhelming the Max message pump. [inference]

### 7.2 Enforced by JS bridge

- **Initialization gate.** No request is processed before
  `live.thisdevice` fires (C1).
- **Path resolution check.** Every `new LiveAPI(path)` is followed
  immediately by a `.id == 0` check (C5). If zero, the bridge responds
  `not_found` and stops.
- **No writes.** The v1 bridge defines no write operation. Functions
  named `api.set` or `api.call` do not appear in the bridge code. This
  is a structural guarantee, not a policy.
- **Bounded iteration.** Every list traversal uses `getcount` (C6).
- **No `immediate` flag.** All bridge functions run on the main
  thread (C2).
- **No observers.** The v1 bridge uses no observer callbacks.

### 7.3 Enforced by architecture

- **Claude cannot bypass the bridge.** The MCP tool surface is the
  complete API. There is no escape hatch for Claude to execute
  arbitrary JS, run shell commands, or issue raw LiveAPI paths. The
  three v1 tools are an exhaustive list.
- **The user controls the lifetime.** If the user removes the copilot
  device from the track or closes Live, every layer terminates. There
  is no persistent background daemon.

## 8. Tool surface for v1

v1 exposes exactly three MCP tools. All three are read-only. Tool
names encode whether they operate deterministically (by explicit path)
or context-sensitively (by current Live selection). This distinction
is [inference] carried over from `docs/research/selection-vs-deterministic.md`.

### 8.1 `inspect_selected_track`

**Category.** Selection-aware helper.

**Parameters.** None.

**Returns.** Summary of the currently selected track in the Session
View. Fields:

```
{
  "track_id": <int>,      // 0 if nothing selected
  "name": <string>,
  "is_group": <bool>,
  "is_foldable": <bool>,
  "device_count": <int>,
  "clip_slot_count": <int>
}
```

**Resolution path.** `live_set view selected_track`, then reads
`name` and calls `getcount("devices")` and `getcount("clip_slots")`.
[verified: LOM PDF, Song.View `selected_track` child of type Track.]

**Not-found behaviour.** If `selected_track.id == 0`, returns
`{"track_id": 0, "error": "no_selection"}`.

### 8.2 `inspect_device_at_path`

**Category.** Deterministic structural.

**Parameters.**

```
{
  "path": <string>       // canonical LOM path, e.g.
                         // "live_set tracks 0 devices 0"
}
```

**Returns.** Summary of the device at the given path. Fields:

```
{
  "device_id": <int>,
  "name": <string>,
  "class_name": <string>,     // e.g. "OriginalSimpler"
  "type": <int>,              // LOM Device.type
  "is_active": <bool>,
  "parameter_count": <int>
}
```

**Resolution path.** The parameter `path` directly.

**Not-found behaviour.** Returns `{"device_id": 0, "error": "not_found",
"path": <echo>}`. No raw stack trace, no LiveAPI error leak.

**Path validation.** The bridge performs only a minimal sanity check
(non-empty string, starts with `live_set` or `live_app` or
`this_device`). Full path grammar validation is [open] — v1 relies on
LiveAPI's own resolution to reject bad paths by returning `id == 0`.

### 8.3 `list_device_parameters`

**Category.** Deterministic structural.

**Parameters.**

```
{
  "device_path": <string>
}
```

**Returns.** Array of parameter summaries, one per parameter on the
device. Per-parameter fields:

```
{
  "index": <int>,
  "name": <string>,
  "value": <float>,
  "min": <float>,
  "max": <float>,
  "is_quantized": <bool>
}
```

**Resolution path.** Resolves the device, calls
`getcount("parameters")`, then iterates constructing a new LiveAPI for
each parameter [verified: LOM PDF, Device.parameters is a list of
DeviceParameter].

**Iteration bound.** The bridge caps the iteration at a hard limit
(e.g. 1024 parameters) to protect against pathological cases; a
normally-configured device will never approach this [inference].

**Not-found behaviour.** Same as `inspect_device_at_path`.

### 8.4 Deliberately absent

v1 does **not** expose tools for:

- Setting or calling anything (no writes).
- Observing changes (no subscriptions).
- Inspecting clips, scenes, or the clip slot matrix. These are
  valuable but would broaden v1 before the core plumbing is proven.
- Listing all tracks. The absence is deliberate — it forces callers to
  either ask about what's selected or ask about a specific path,
  which keeps the mental model clean.

## 9. MVP implementation slice

The minimum end-to-end capability that proves the architecture works:

1. User loads the copilot `.amxd` onto a track in a Live Set.
2. The device boots:
   - `[live.thisdevice]` fires.
   - `[js copilot-bridge.js]` sets `initialized = true`.
   - `[node.script]` starts the MCP server.
3. User connects Claude as an MCP client to the copilot.
4. Claude calls `inspect_selected_track`.
5. The round-trip completes as described in section 5 and returns a
   populated summary.
6. Claude calls `inspect_device_at_path` with
   `"live_set tracks 0 devices 0"`.
7. Return.
8. Claude calls `list_device_parameters` on the same path.
9. Return with a non-empty array.

If all three return correct structured data within ~500ms per call,
v1 is functionally proven. Observable success criteria:

- Zero Max console errors during boot or during the tool round-trips.
- No observer leaks (trivially — v1 uses no observers).
- Removing the device from the track terminates the MCP server and
  closes Claude's connection cleanly.

A single `.amxd` plus a single MCP config entry on Claude's side is
the full deliverable shape.

## 10. Risks and deferred decisions

Each item below is [open] — explicitly not resolved by this document.

**R1. MCP transport over `[node.script]`.** We do not yet know whether
a standard stdio-based MCP server hosted inside Node for Max is
correctly visible to Claude as an MCP client. `[node.script]` runs
Node in a child process whose stdio streams are claimed by Max's
runtime. If stdio is not usable, the MCP server must fall back to a
local TCP socket or Unix domain socket, and Claude's MCP client
configuration must point at that endpoint. **Smallest experiment:**
spawn a minimal MCP server with one tool (`ping → pong`) inside
`[node.script]`, attempt to connect Claude to it over each transport
in turn. Record which works.

**R2. Initialization race.** If Claude connects before the M4L device
finishes booting, tool calls will hit the `not_ready` gate. This is
correct behaviour but the UX needs testing: does Claude retry? How
long is the boot window in practice? **Smallest experiment:** measure
time from device instantiation to `live.thisdevice` bang on a
representative machine; test Claude's retry behaviour against a
deliberately slow-boot bridge.

**R3. `max-api` message-size limits.** The Node for Max API PDF does
not document a message size limit for `outlet` calls. A `list_device_parameters`
response on a device with 300+ parameters could be large. **Smallest
experiment:** exercise the round-trip with a RackDevice having many
macros plus a big PluginDevice to see where (if anywhere) the pipe
chokes.

**R4. Auth and trust.** v1 is trust-by-colocation: any MCP client on
the machine can connect. If Claude is running in a browser on the
same machine, a compromised page could theoretically drive the
copilot. v1 accepts this risk because the tools are read-only and the
surface is tiny. v2's write tools cannot accept this risk.

**R5. Push 3 Standalone.** Node for Max's availability and behaviour
on Push Standalone is undocumented here. v1 targets desktop Live only.

**R6. Undo coalescing semantics.** When v2 adds writes, each write is
likely to create an undo entry. A tool call that "tweaks a parameter"
from Claude's perspective might appear as one action in Claude's
history and N undo entries in Live's. The mapping is [open]. The
correct resolution may require `[live.remote~]`-style modulation for
non-user-visible tweaks and explicit "commit a named transaction"
semantics for user-visible edits. See
`docs/principles/undo-discipline.md`.

**R7. Parameter identity of copilot-authored content.** v1 never
writes, so this is deferred. When v2 arrives, any device the copilot
creates or modifies must carry stable Long Names so the user's
subsequent sets don't break on copilot updates. See
`docs/principles/parameter-identity.md`.

**R8. Performance under large sessions.** We have no measurements for
LiveAPI response times in a 200-track session. The MVP tests on small
sets; behaviour at scale is [open].

**R9. Node for Max cold-start cost.** Spawning Node adds latency when
the device first loads. How much, and whether it blocks audio or UI,
is not yet measured.

**R10. MCP server discovery.** Claude's MCP config must know where to
find the copilot. In v1 this is a manual configuration step by the
user. Automating discovery (e.g. via a well-known port, a config
file, or a protocol broadcast) is v2+.

## 11. Next experiments / validation steps

Before v1 is declared shippable, these experiments must run. Each one
converts a piece of this document from [inference] or [open] to
[experiment]-verified.

1. **Bridge boot trace.** Instrument the bridge to log each
   initialization stage. Measure the time from `loadbang` to
   `live.thisdevice` bang to MCP-server-ready. Establishes R2 and R9.

2. **Three-tool round-trip.** Implement the three v1 tools against a
   known Live Set. Verify correct data for every field. Measure
   latency per tool call. Establishes MVP success criteria in §9.

3. **Transport probe.** Resolve R1. Record which MCP transport works
   inside `[node.script]`.

4. **Large-response probe.** Resolve R3 by testing
   `list_device_parameters` against a RackDevice of significant size.

5. **Device-removal sanity.** Remove the copilot device during an
   in-flight tool call. Verify the MCP server terminates cleanly and
   Claude sees a clean disconnect.

6. **Initialization race probe.** Issue tool calls during the boot
   window. Verify `not_ready` responses and observe Claude's retry
   behaviour.

When all six experiments are complete with green results, v1 is ready
for internal use. External release waits on v2's write-safety model.
