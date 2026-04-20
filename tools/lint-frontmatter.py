#!/usr/bin/env python3
"""
lint-frontmatter.py — Validate YAML frontmatter in repo markdown files.

Adapted for RC-600_Dev from ableton_dev_2.
Removed live_version / max_version requirements.
Added firmware_version requirement for surface: reference.
Restored second-pass cross-reference validation.

Usage:
    python3 tools/lint-frontmatter.py [--strict] [path ...]

If no paths given, scans:
    docs/reference/  docs/principles/  docs/research/
    docs/adr/  docs/_meta/  experiments/*/SPEC.md

Exit codes:
    0 — all files pass
    1 — at least one error
    2 — at least one warning (only with --strict)
"""

import sys
import os
import re
import glob
from datetime import date

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. pip install pyyaml", file=sys.stderr)
    sys.exit(1)

REQUIRED_FIELDS = {"id", "title", "surface", "evidence", "confidence", "last_verified"}

VALID_SURFACES = {
    "meta", "reference", "principle", "research", "experiment", "adr", "example"
}
VALID_EVIDENCE = {"official", "experiment", "inference", "open"}
VALID_CONFIDENCE = {"high", "medium", "low"}

CROSS_REF_LIST_FIELDS = ("related", "supersedes")
CROSS_REF_SINGLE_FIELDS = ("superseded_by",)

WARN_STALENESS_DAYS = 365
ERROR_STALENESS_DAYS = 548  # ~18 months


def extract_frontmatter(filepath):
    """Return (yaml_dict, errors) from file."""
    errors = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        return None, [f"Cannot read file: {e}"]

    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
    if not m:
        return None, ["No YAML frontmatter found (expected --- delimiters)"]

    try:
        data = yaml.safe_load(m.group(1))
    except yaml.YAMLError as e:
        return None, [f"YAML parse error: {e}"]

    if not isinstance(data, dict):
        return None, ["Frontmatter is not a YAML mapping"]

    return data, errors


def validate(filepath, data, all_ids, repo_root):
    """Return (errors, warnings) lists."""
    errors = []
    warnings = []

    # Required fields
    missing = REQUIRED_FIELDS - set(data.keys())
    if missing:
        errors.append(f"Missing required fields: {', '.join(sorted(missing))}")
        return errors, warnings

    # Surface
    if data["surface"] not in VALID_SURFACES:
        errors.append(
            f"Invalid surface '{data['surface']}'. Valid: {', '.join(sorted(VALID_SURFACES))}"
        )

    # Evidence
    if data["evidence"] not in VALID_EVIDENCE:
        errors.append(
            f"Invalid evidence '{data['evidence']}'. Valid: {', '.join(sorted(VALID_EVIDENCE))}"
        )

    # Confidence
    if data["confidence"] not in VALID_CONFIDENCE:
        errors.append(
            f"Invalid confidence '{data['confidence']}'. Valid: {', '.join(sorted(VALID_CONFIDENCE))}"
        )

    # confidence: high requires strong evidence
    # Meta-surface docs are self-evidencing (they define rules, not hardware facts)
    if (
        data["confidence"] == "high"
        and data["evidence"] in ("inference", "open")
        and data["surface"] != "meta"
    ):
        errors.append("confidence: high requires evidence: official or experiment")

    # evidence: official requires source
    if data["evidence"] == "official" and not data.get("source"):
        errors.append("evidence: official requires a 'source' field")

    # evidence: experiment requires experiment_path with non-empty results/
    if data["evidence"] == "experiment":
        exp_path = data.get("experiment_path")
        if not exp_path:
            errors.append("evidence: experiment requires 'experiment_path' field")
        else:
            full = os.path.join(repo_root, exp_path)
            results = os.path.join(full, "results")
            if not os.path.isdir(results):
                errors.append(
                    f"experiment_path '{exp_path}' has no results/ directory"
                )
            else:
                result_files = [f for f in os.listdir(results) if not f.startswith(".")]
                if not result_files:
                    errors.append(
                        f"experiment_path '{exp_path}/results/' is empty — "
                        "cannot claim evidence: experiment without results"
                    )

    # surface: reference requires firmware_version
    if data["surface"] == "reference" and not data.get("firmware_version"):
        errors.append("surface: reference requires 'firmware_version' field")

    # Cross-reference field shape validation
    for field in CROSS_REF_LIST_FIELDS:
        value = data.get(field)
        if value is None:
            continue
        if not isinstance(value, list):
            errors.append(f"{field} must be a list of ids")
            continue
        for item in value:
            if not isinstance(item, str) or not item.strip():
                errors.append(f"{field} entries must be non-empty strings")

    for field in CROSS_REF_SINGLE_FIELDS:
        value = data.get(field)
        if value is None:
            continue
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{field} must be a non-empty id string")

    # ID uniqueness
    doc_id = data["id"]
    if doc_id in all_ids:
        errors.append(f"Duplicate id '{doc_id}' — also in {all_ids[doc_id]}")
    all_ids[doc_id] = filepath

    # Staleness
    try:
        verified = date.fromisoformat(str(data["last_verified"]))
        age = (date.today() - verified).days
        if age > ERROR_STALENESS_DAYS:
            errors.append(f"last_verified is {age} days ago (> {ERROR_STALENESS_DAYS}d limit)")
        elif age > WARN_STALENESS_DAYS:
            warnings.append(f"last_verified is {age} days ago — consider re-verifying")
    except (ValueError, TypeError):
        errors.append(
            f"last_verified '{data.get('last_verified')}' is not a valid ISO date"
        )

    return errors, warnings


def validate_cross_references(filepath, data, known_ids):
    """Return cross-reference errors after all ids are known."""
    errors = []

    for field in CROSS_REF_LIST_FIELDS:
        refs = data.get(field) or []
        if not isinstance(refs, list):
            continue  # shape errors handled in validate()
        for ref_id in refs:
            if isinstance(ref_id, str) and ref_id not in known_ids:
                errors.append(f"{field} references unknown id '{ref_id}'")

    for field in CROSS_REF_SINGLE_FIELDS:
        ref_id = data.get(field)
        if ref_id is None or not isinstance(ref_id, str):
            continue  # missing/shape handled elsewhere or optional
        if ref_id not in known_ids:
            errors.append(f"{field} references unknown id '{ref_id}'")

    return errors


def find_files(repo_root, explicit_paths):
    """Return list of markdown files to check."""
    if explicit_paths:
        return explicit_paths

    patterns = [
        "docs/*.md",
        "docs/reference/**/*.md",
        "docs/principles/**/*.md",
        "docs/research/**/*.md",
        "docs/adr/**/*.md",
        "docs/_meta/**/*.md",
        "experiments/[0-9]*/SPEC.md",
    ]
    files = []
    for pat in patterns:
        files.extend(glob.glob(os.path.join(repo_root, pat), recursive=True))
    return sorted(set(files))


def main():
    strict = "--strict" in sys.argv
    explicit = [a for a in sys.argv[1:] if a != "--strict"]

    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)

    files = find_files(repo_root, explicit)
    if not files:
        print("No files to check.")
        return 0

    all_ids = {}
    parsed_files = []
    total_errors = 0
    total_warnings = 0

    for fpath in files:
        rel = os.path.relpath(fpath, repo_root)
        data, parse_errors = extract_frontmatter(fpath)

        if parse_errors:
            for e in parse_errors:
                print(f"ERROR  {rel}: {e}")
            total_errors += len(parse_errors)
            continue

        errors, warnings = validate(fpath, data, all_ids, repo_root)
        parsed_files.append((fpath, data))

        for e in errors:
            print(f"ERROR  {rel}: {e}")
        for w in warnings:
            print(f"WARN   {rel}: {w}")

        total_errors += len(errors)
        total_warnings += len(warnings)

    known_ids = set(all_ids.keys())
    for fpath, data in parsed_files:
        rel = os.path.relpath(fpath, repo_root)
        errors = validate_cross_references(fpath, data, known_ids)
        for e in errors:
            print(f"ERROR  {rel}: {e}")
        total_errors += len(errors)

    print(f"\n{'='*60}")
    print(f"Files checked: {len(files)}")
    print(f"Errors: {total_errors}")
    print(f"Warnings: {total_warnings}")

    if total_errors:
        return 1
    if strict and total_warnings:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
