#!/usr/bin/env python3
"""
compare-rc0-experiments.py — Focused comparison helper for controlled RC0 experiments.

This tool is intentionally read-only and does not require the input files to be
valid XML. It compares a baseline RC0 file against a changed RC0 file using the
same non-assumptive extraction logic as the other RC0 utilities in this repo.

Goal:
- prioritize repeated track-field changes
- surface small localized memory-level changes
- optionally suppress or filter noisy IFX/TFX payload differences
- help interpret single-parameter mapping experiments without semantic guessing

Usage:
    python3 tools/compare-rc0-experiments.py left.RC0 right.RC0
    python3 tools/compare-rc0-experiments.py --focus database/mem/TRACK* left.RC0 right.RC0
    python3 tools/compare-rc0-experiments.py --exclude-ifx --exclude-tfx left.RC0 right.RC0

Exit codes:
    0 — comparison completed successfully
    1 — one or both inputs were unreadable, binary, or undecodable
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
class ChangedRecord:
    path: str
    left_value: str
    right_value: str


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
        result.error = "Binary content detected; experiment comparison is text-only"
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


def diff_maps(left_map: dict[str, str], right_map: dict[str, str]) -> list[ChangedRecord]:
    changed: list[ChangedRecord] = []
    for path in sorted(set(left_map.keys()) & set(right_map.keys())):
        left_value = left_map[path]
        right_value = right_map[path]
        if left_value != right_value:
            changed.append(ChangedRecord(path=path, left_value=left_value, right_value=right_value))
    return changed


def track_family(path: str) -> str | None:
    parts = path.split('/')
    if len(parts) >= 4 and parts[0] == 'database' and parts[1] == 'mem' and TRACK_SECTION_RE.match(parts[2]):
        return f"database/mem/TRACK*/{parts[3]}"
    return None


def memory_group(path: str) -> str | None:
    parts = path.split('/')
    if len(parts) >= 4 and parts[0] == 'database' and parts[1] == 'mem' and not TRACK_SECTION_RE.match(parts[2]):
        return f"database/mem/{parts[2]}"
    return None


def focus_matches(path: str, focus: str | None) -> bool:
    if not focus:
        return True
    if focus.endswith('*'):
        return path.startswith(focus[:-1])
    return path.startswith(focus)


def is_suppressed_noise(path: str, exclude_ifx: bool, exclude_tfx: bool) -> bool:
    if exclude_ifx and path.startswith('database/ifx/'):
        return True
    if exclude_tfx and path.startswith('database/tfx/'):
        return True
    return False


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
        for warning in result.warnings[:30]:
            lines.append(f"- {warning}")
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description='Compare two RC0 files with noise suppression for controlled experiments')
    parser.add_argument('left', help='Baseline RC0 file')
    parser.add_argument('right', help='Changed RC0 file')
    parser.add_argument('--focus', help='Optional path prefix to focus on, e.g. database/mem/TRACK*')
    parser.add_argument('--exclude-ifx', action='store_true', help='Suppress IFX path changes from focused output')
    parser.add_argument('--exclude-tfx', action='store_true', help='Suppress TFX path changes from focused output')
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
    changed = diff_maps(left_map, right_map)

    suppressed_counter: collections.Counter[str] = collections.Counter()
    focused: list[ChangedRecord] = []
    for record in changed:
        if is_suppressed_noise(record.path, args.exclude_ifx, args.exclude_tfx):
            if record.path.startswith('database/ifx/'):
                suppressed_counter['database/ifx'] += 1
            elif record.path.startswith('database/tfx/'):
                suppressed_counter['database/tfx'] += 1
            else:
                suppressed_counter['other'] += 1
            continue
        if focus_matches(record.path, args.focus):
            focused.append(record)

    repeated_track_groups: dict[str, list[ChangedRecord]] = collections.defaultdict(list)
    localized_memory_groups: dict[str, list[ChangedRecord]] = collections.defaultdict(list)

    for record in focused:
        track_key = track_family(record.path)
        if track_key is not None:
            repeated_track_groups[track_key].append(record)
            continue
        memory_key = memory_group(record.path)
        if memory_key is not None:
            localized_memory_groups[memory_key].append(record)

    output_lines.append('FOCUSED_CHANGED_PATHS:')
    if not focused:
        output_lines.append('- none')
    else:
        for record in focused:
            output_lines.append(f"- {record.path}: {record.left_value} -> {record.right_value}")

    output_lines.append('')
    output_lines.append('REPEATED_TRACK_FIELD_CHANGES:')
    rendered_track = False
    for family in sorted(repeated_track_groups.keys()):
        records = repeated_track_groups[family]
        if len(records) < 2:
            continue
        rendered_track = True
        output_lines.append(f"- {family}")
        output_lines.append(f"  instances_changed: {len(records)}")
        output_lines.append('  observed_paths:')
        for record in sorted(records, key=lambda item: item.path):
            output_lines.append(f"    - {record.path}: {record.left_value} -> {record.right_value}")
    if not rendered_track:
        output_lines.append('- none')

    output_lines.append('')
    output_lines.append('LOCALIZED_MEMORY_CHANGES:')
    rendered_memory = False
    for family in sorted(localized_memory_groups.keys()):
        records = localized_memory_groups[family]
        if len(records) > 5:
            continue
        rendered_memory = True
        output_lines.append(f"- {family}")
        output_lines.append(f"  instances_changed: {len(records)}")
        output_lines.append('  observed_paths:')
        for record in sorted(records, key=lambda item: item.path):
            output_lines.append(f"    - {record.path}: {record.left_value} -> {record.right_value}")
    if not rendered_memory:
        output_lines.append('- none')

    output_lines.append('')
    output_lines.append('SUPPRESSED_NOISE_SUMMARY:')
    if not suppressed_counter:
        output_lines.append('- none')
    else:
        for key in sorted(suppressed_counter.keys()):
            output_lines.append(f"- {key}: {suppressed_counter[key]} suppressed changes")

    output_lines.append('')
    output_lines.append('SUMMARY:')
    output_lines.append(f"- total_changed_paths: {len(changed)}")
    output_lines.append(f"- focused_changed_paths: {len(focused)}")
    output_lines.append(f"- repeated_track_field_families: {sum(1 for records in repeated_track_groups.values() if len(records) >= 2)}")
    output_lines.append(f"- localized_memory_groups: {sum(1 for records in localized_memory_groups.values() if len(records) <= 5)}")
    output_lines.append(f"- noise_suppressed: {sum(suppressed_counter.values())}")

    print('\n'.join(output_lines).rstrip())
    return 0


if __name__ == '__main__':
    sys.exit(main())
