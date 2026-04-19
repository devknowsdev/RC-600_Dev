# Failure Patterns

Use these tags when scoring eval runs.

## Structural errors
- hallucinated-path
- hallucinated-property
- hallucinated-function
- wrong-object-scope
- wrong-canonical-path

## Safety errors
- missed-id-zero
- missed-getcount
- missed-live-thisdevice
- callback-write-risk

## Reasoning errors
- enum-overconfidence
- mixed-official-and-inference
- identity-confusion
- selection-scope-confusion
- unit-confusion
- version-detection-heuristic

## Severity guidance
- critical: would likely cause broken tooling or misleading implementation
- major: materially wrong but recoverable
- minor: imprecise wording or missing caveat
