# Eval Run Notes

For each eval run record:
- model
- date
- repo commit
- prompt used
- score
- major failures
- improvements needed

Recommended prompt wrapper:

"Answer only from the repo knowledge. If something is uncertain, say so. Do not invent properties, functions, enum mappings, or paths."

Scoring format:

- Q1: 0/1/2
- Q2: 0/1/2
- ...
- Total: X/Y

Failure tags:
- hallucinated-path
- hallucinated-property
- missed-id-zero
- missed-getcount
- mixed-structure-and-behavior
- enum-overconfidence
