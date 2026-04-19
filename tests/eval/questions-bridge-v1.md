# Bridge / MCP Eval Set 03

Purpose: evaluate whether an assistant can reason correctly about the planned Ableton copilot bridge architecture: MCP tool design, Node for Max boundaries, JS/LiveAPI ownership, initialization safety, and read/write constraints.

Scoring per question:
- 2 = correct, precise, and safety-aware
- 1 = partly correct but misses an important boundary or caveat
- 0 = wrong, hallucinated, or unsafe

Automatic fail signals:
- assigns LiveAPI ownership to Node for Max
- permits writes from callbacks
- ignores `live.thisdevice` initialization
- proposes raw arbitrary-path execution as the public tool interface
- collapses read-only v1 and future write-capable v2 boundaries

## Q1
Where should LiveAPI ownership live in the v1 bridge architecture?

Expected points:
- JS bridge / Max-side ownership
- Node for Max communicates through Max messaging
- Node should not directly own LiveAPI objects

## Q2
Why is `live.thisdevice` part of the initialization handshake?

Expected points:
- LiveAPI is not safe/available at JS load time
- requests should be rejected or delayed until initialized
- this prevents invalid early-path access

## Q3
Should the public MCP interface expose arbitrary raw LiveAPI path execution?

Expected points:
- no
- public tool surface should be narrow and explicit
- avoid bypassing safety model
- tool API should be deterministic and auditable

## Q4
What is the correct v1 stance on writes to Live state?

Expected points:
- v1 is read-only by design
- no mutation tools in public MCP surface
- write safety is deferred to later versions

## Q5
If future versions add writes, can they happen directly inside observer callbacks?

Expected points:
- no
- never write to Live from observer callback
- defer/schedule writes outside callback chain

## Q6
Why is request correlation best owned by Node rather than JS?

Expected points:
- Node owns MCP request lifecycle
- Node↔Max is asynchronous
- correlation IDs belong with MCP call management

## Q7
Why should the v1 tool surface prefer a few named tools over “run any path / call any method”?

Expected points:
- safety
- auditability
- lower hallucination risk
- easier schema definition and eval
- user-facing predictability

## Q8
What is a good v1 tool for selection-aware inspection?

Expected points:
- something like `inspect_selected_track`
- reads current Live selection safely
- does not imply arbitrary selection mutation

## Q9
What is a good v1 tool for deterministic structural inspection?

Expected points:
- something like `inspect_device_at_path`
- explicit path parameter
- read-only result
- validates/resolves path safely with `id == 0` handling

## Q10
Why is `list_device_parameters` a better v1 tool than “set_device_parameter”?

Expected points:
- read-only
- exposes useful structure without mutation risk
- aligns with v1 inspection goals

## Q11
What happens if a tool call arrives before the bridge is initialized?

Expected points:
- return `not_ready` or equivalent
- do not attempt premature LiveAPI construction
- avoid crashing / invalid access

## Q12
Why should list traversal still use `getcount()` inside bridge implementations even if the tool API is high-level?

Expected points:
- internal implementation must still obey LiveAPI safety rules
- object counts are not assumed
- avoids brittle indexing

## Q13
What is the difference between a selection-aware tool and a deterministic tool?

Expected points:
- selection-aware depends on current Live UI state
- deterministic depends on explicit path/arguments
- both can be useful but must be clearly named and scoped

## Q14
If an assistant proposes exposing a shell-like “execute arbitrary JS in the bridge” tool, what is wrong with that?

Expected points:
- bypasses safety model
- impossible to audit safely
- increases hallucination and damage risk
- violates narrow-tool design

## Q15
Why is read-only v1 still valuable even without mutation?

Expected points:
- establishes architecture
- validates transport and lifecycle
- supports inspection/debugging workflows
- provides safe foundation for later write model

## Q16
What are the most likely open issues still needing experiments for bridge v1?

Expected points:
- transport viability inside Node for Max
- initialization race timing
- message size / payload limits
- cold-start cost
- behavior on device removal / disconnect
- large-session performance

## Rubric notes

A strong answer set should:
- keep LiveAPI in JS/Max layer
- keep MCP lifecycle in Node layer
- defend narrow tool design
- preserve read-only v1 boundary
- mention initialization gating and `id == 0`
- avoid inventing features that were not specified

Suggested threshold:
- 28–32: strong bridge reasoning
- 22–27: usable but boundary-sloppy
- 16–21: risky architecture understanding
- <16: not ready for bridge work
