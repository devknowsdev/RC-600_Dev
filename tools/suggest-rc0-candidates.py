#!/usr/bin/env python3
"""
suggest-rc0-candidates.py — Rank changed RC0 paths by parameter-mapping promise.

This tool is intentionally read-only and does not require the input files to be
valid XML. It reuses the same binary/text detection and tag-scanning approach as
existing RC0 utilities in this repo.

Goal:
- compare two RC0 files
- identify changed paths
- group them into structural families
- rank those families by how promising they are as parameter-mapping candidates

Usage:
    python3 tools/suggest-rc0-candidates.py left.RC0 right.RC0

Exit codes:
    0 — analysis completed successfully
    1 — one or both inputs were unreadable, binary, or undecodable

Notes:
- No semantic guessing is performed for short field tags such as A/B/C.
- Rankings are heuristic and structure-based only.
- Repeated parallel changes under database/mem/TRACKn/* are scored highest.
"""

from __future__ import annotations

import argparse
import collections
import pathlib
import re
import sys
from dataclasses import dataclass

TAG_TOKEN = re.compile(r"<\s*(/?)\s*([A-Za-z0-9_#-]+)(?:\s+[^<>]*?)?\s*(/?)>")
CONTROL_CHARS = bytes(range(0, 9)) + bytes(range(14, 32))
TRACK_SECTION_RE = re.compile(r"^TRACK\d+$")


@dataclass
class LeafRecord:
    path: str
    value: str


@dataclass
class FileResult:
    path: pathlib.Path
    readable: bool
    is_binary: bool = False
    encoding_used: str | None = None
    leaf_records: list[LeafRecord] | None = None
    warnings: list[str] | None = None
    error: str | None = None


@dataclass
class CandidateGroup:
    family: str
    observed_paths: list[str]
    instances_changed: int
    rationale: str
    priority: str
    score: int


def detect_binary(data: bytes) -> bool:
    if not data:
        return False
    if b"\x00" in data:
        return True
    sample = data[:4096]
    control_count = sum(byte in CONTROL_CHARS for byte in sample)
    return (control_count / max(len(sample), 1)) > 0.05


def decode_text(data: bytes) -> tuple[str | None, str | None]:
    for encoding in ("utf-8", "utf-8-sig", "cp1252", "latin-1"):
        try:
            return data.decode(encoding), encoding
        except UnicodeDecodeError:
            continue
    return None, None


def normalize_scalar_value(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def extract_paths(text: str) -> tuple[list[LeafRecord], list[str]]:
    stack: list[str] = []
    leaf_records: list[LeafRecord] = []
    warnings: list[str] = []

    matches = list(TAG_TOKEN.finditer(text))
    for index, match in enumerate(matches):
        is_close = bool(match.group(1))
        tag_name = match.group(2)
        is_self_closing = bool(match.group(3))

        if not is_close:
            stack.append(tag_name)
            next_start = matches[index + 1].start() if index + 1 < len(matches) else len(text)
            inner_text = text[match.end():next_start]
            compact_value = normalize_scalar_value(inner_text)
            if compact_value:
                leaf_records.append(LeafRecord(path="/".join(stack), value=compact_value))
            if is_self_closing:
                stack.pop()
        else:
            if not stack:
                warnings.append(f"Unmatched closing tag </{tag_name}> encountered")
                continue
            if stack[-1] == tag_name:
                stack.pop()
            else:
                warnings.append(
                    f"Mismatched closing tag </{tag_name}> encountered while current path is {'/'.join(stack)}"
                )
                if tag_name in stack:
                    while stack and stack[-1] != tag_name:
                        stack.pop()
                    if stack and stack[-1] == tag_name:
                        stack.pop()
                else:
                    stack.clear()

    if stack:
        warnings.append(f"Unclosed tags remain at end of file: {'/'.join(stack)}")

    return leaf_records, warnings


def inspect_file(path: pathlib.Path) -> FileResult:
    result = FileResult(path=path, readable=False, leaf_records=[], warnings=[])
    try:
        data = path.read_bytes()
    except Exception as exc:  # noqa: BLE001
        result.error = f"Cannot read file: {exc}"
        return result

    result.readable = True
    result.is_binary = detect_binary(data)
    if result.is_binary:
        result.error = "Binary content detected; candidate analysis is text-only"
        return result

    text, encoding = decode_text(data)
    if text is None:
        result.error = "Unable to decode text content using supported encodings"
        return result

    result.encoding_used = encoding
    leaf_records, warnings = extract_paths(text)
    result.leaf_records = leaf_records
    result.warnings = warnings
    return result


def first_value_map(leaf_records: list[LeafRecord]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for record in leaf_records:
        if record.path not in mapping:
            mapping[record.path] = record.value
    return mapping


def changed_paths(left_map: dict[str, str], right_map: dict[str, str]) -> list[str]:
    changed: list[str] = []
    for path in sorted(set(left_map.keys()) & set(right_map.keys())):
        if left_map[path] != right_map[path]:
            changed.append(path)
    return changed


def family_for_path(path: str) -> str:
    parts = path.split('/')
    if len(parts) < 4:
        return path

    if len(parts) >= 4 and parts[0] == 'database' and parts[1] == 'mem' and TRACK_SECTION_RE.match(parts[2]):
        return f"database/mem/TRACK*/{parts[3]}"

    if len(parts) >= 4 and parts[0] == 'database' and parts[1] == 'mem':
        return f"database/mem/{parts[2]}/{parts[3]}"

    if len(parts) >= 4 and parts[0] == 'database' and parts[1] in {'ifx', 'tfx'}:
        return f"database/{parts[1]}/{parts[2]}/*"

    if len(parts) >= 3 and parts[0] == 'database':
        return f"database/{parts[1]}/{parts[2]}"

    return path


def group_summary_key(path: str) -> str:
    parts = path.split('/')
    if len(parts) >= 3 and parts[0] == 'database' and parts[1] == 'mem' and TRACK_SECTION_RE.match(parts[2]):
        return 'database/mem/TRACK*'
    if len(parts) >= 3 and parts[0] == 'database' and parts[1] == 'mem':
        return f"database/mem/{parts[2]}"
    if len(parts) >= 2 and parts[0] == 'database':
        return f"database/{parts[1]}"
    return parts[0]


def score_group(family: str, observed_paths: list[str]) -> CandidateGroup:
    score = 0
    rationale_parts: list[str] = []
    instances_changed = len(observed_paths)

    if family.startswith('database/mem/TRACK*/'):
        score += 5
        rationale_parts.append('under database/mem track blocks')
        if instances_changed >= 3:
            score += 4
            rationale_parts.append('repeated change across parallel track sections')
        elif instances_changed == 2:
            score += 2
            rationale_parts.append('repeated change across more than one track section')

    elif family.startswith('database/mem/'):
        score += 3
        rationale_parts.append('under database/mem memory-level section')
        if instances_changed == 1:
            rationale_parts.append('single localized memory-level change')

    elif family.startswith('database/ifx/') or family.startswith('database/tfx/'):
        score -= 3
        rationale_parts.append('deep FX payload section')
        if instances_changed >= 3:
            score -= 2
            rationale_parts.append('clustered neighboring FX changes suggest preset-style payload drift')

    else:
        rationale_parts.append('structural family outside primary memory sections')

    if score >= 7:
        priority = 'HIGH'
    elif score >= 2:
        priority = 'MEDIUM'
    else:
        priority = 'LOW'

    return CandidateGroup(
        family=family,
        observed_paths=sorted(observed_paths),
        instances_changed=instances_changed,
        rationale='; '.join(rationale_parts),
        priority=priority,
        score=score,
    )


def render_file_status(label: str, result: FileResult) -> list[str]:
    lines = [f"{label}_FILE: {result.path}"]
    if not result.readable:
        lines.append(f"{label}_STATUS: error")
        lines.append(f"{label}_ERROR: {result.error}")
        return lines
    if result.is_binary:
        lines.append(f"{label}_STATUS: binary")
        lines.append(f"{label}_ERROR: {result.error}")
        return lines
    lines.append(f"{label}_STATUS: ok")
    lines.append(f"{label}_ENCODING: {result.encoding_used}")
    if result.warnings:
        lines.append(f"{label}_WARNINGS:")
        for warning in result.warnings[:50]:
            lines.append(f"- {warning}")
    return lines


def render_candidate_section(title: str, groups: list[CandidateGroup]) -> list[str]:
    lines = [f"{title}:"]
    if not groups:
        lines.append('- none')
        return lines

    for group in groups:
        lines.append(f"- {group.family}")
        lines.append(f"  instances_changed: {group.instances_changed}")
        lines.append('  observed_paths:')
        for path in group.observed_paths:
            lines.append(f"    - {path}")
        lines.append(f"  rationale: {group.rationale}")
    return lines


def render_group_summary(changed: list[str]) -> list[str]:
    counts = collections.Counter(group_summary_key(path) for path in changed)
    lines = ['GROUP_SUMMARY:']
    if not counts:
        lines.append('- none')
        return lines
    for key in sorted(counts.keys()):
        lines.append(f"- {key}: {counts[key]} changed leaves")
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description='Rank changed RC0 paths by parameter-mapping promise')
    parser.add_argument('left', help='Left-hand RC0 file')
    parser.add_argument('right', help='Right-hand RC0 file')
    args = parser.parse_args()

    left_result = inspect_file(pathlib.Path(args.left))
    right_result = inspect_file(pathlib.Path(args.right))

    output_lines: list[str] = []
    output_lines.extend(render_file_status('LEFT', left_result))
    output_lines.append('')
    output_lines.extend(render_file_status('RIGHT', right_result))
    output_lines.append('')

    if (not left_result.readable) or left_result.is_binary or (not right_result.readable) or right_result.is_binary:
        print('\n'.join(output_lines).rstrip())
        return 1

    left_map = first_value_map(left_result.leaf_records or [])
    right_map = first_value_map(right_result.leaf_records or [])
    changed = changed_paths(left_map, right_map)

    grouped: dict[str, list[str]] = collections.defaultdict(list)
    for path in changed:
        grouped[family_for_path(path)].append(path)

    candidate_groups = [score_group(family, paths) for family, paths in grouped.items()]
    candidate_groups.sort(key=lambda item: (-item.score, item.family))

    high = [group for group in candidate_groups if group.priority == 'HIGH']
    medium = [group for group in candidate_groups if group.priority == 'MEDIUM']
    low = [group for group in candidate_groups if group.priority == 'LOW']

    output_lines.extend(render_candidate_section('HIGH_PRIORITY_CANDIDATES', high))
    output_lines.append('')
    output_lines.extend(render_candidate_section('MEDIUM_PRIORITY_CANDIDATES', medium))
    output_lines.append('')
    output_lines.extend(render_candidate_section('LOW_PRIORITY_CANDIDATES', low))
    output_lines.append('')
    output_lines.extend(render_group_summary(changed))

    print('\n'.join(output_lines).rstrip())
    return 0


if __name__ == '__main__':
    sys.exit(main())
