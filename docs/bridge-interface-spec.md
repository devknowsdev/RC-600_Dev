# Bridge Interface Spec v1

## Status
Draft v1 — read-only, minimal tool surface

## Purpose
Define the MCP tool interface for interacting with Ableton Live via the bridge.

This spec is the contract between:
- LLM (GPT / Claude)
- Node (MCP server)
- Max JS (LiveAPI layer)

---

## Design constraints

- v1 is **read-only**
- No arbitrary path execution
- No arbitrary JS execution
- Narrow, explicit tool surface
- All tools must be:
  - deterministic
  - auditable
  - safe against hallucinated paths

---

## Architecture

LLM → MCP (Node) → Node for Max → Max JS → LiveAPI

- Node handles:
  - request lifecycle
  - correlation IDs
  - tool schema
- Max JS handles:
  - LiveAPI access
  - path resolution
  - `id == 0` safety
  - `getcount()` traversal

---

## Tool design principles

1. Prefer **named tools** over generic execution
2. Prefer **structured outputs**
3. Avoid exposing raw LiveAPI paths directly
4. Separate:
   - selection-aware tools
   - deterministic tools
5. Fail safely:
   - return `id: 0` equivalent states
   - return `not_ready` if bridge not initialized

---

# Tool Set v1

## 1. inspect_selected_track

### Description
Returns information about the currently selected track.

### Input
None

### Output
```json
{
  "track_id": number,
  "name": string,
  "devices": [
    {
      "index": number,
      "name": string,
      "class_name": string
    }
  ]
}
## Path validation rules

For tools accepting a `path`:

- Must start with:
  - `live_set`
  - or `live_app`

- Must resolve to a valid object (not a parameter)

- Forbidden targets:
  - DeviceParameter endpoints (e.g. `... volume`)
  - direct value paths

- If path resolves to:
  - id 0 → return `{ error: "id_zero" }`
  - invalid structure → `{ error: "invalid_path" }`

- Tools must not interpret paths as commands.