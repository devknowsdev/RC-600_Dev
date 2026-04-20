#!/usr/bin/env python3
"""
diff-rc0-paths.py — Diff hierarchical paths and values between two RC-600 .RC0 files.

This tool is intentionally read-only and does not assume the input files are
valid XML. It reuses the same text/binary detection and tag-scanning approach
as the existing RC0 utilities so it can compare XML-like RC0 structures without
requiring well-formed XML.

Usage:
    python3 tools/diff-rc0-paths.py left.RC0 right.RC0
    python3 tools/diff-rc0-paths.py --changed-only left.RC0 right.RC0
    python3 tools/diff-rc0-paths.py --summary-only left.RC0 right.RC0

Exit codes:
    0 — diff completed successfully
    1 — one or both inputs were unreadable, binary, or undecodable

Notes:
- Binary detection is treated as a hard stop for this tool.
- Diffing is based on normalized extracted leaf paths.
- The tool does not infer semantic meanings for short tags such as A/B/C.
- For repeated observed values at the same path, the first observed value is used,
  matching the deterministic behavior of the current extractor.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys
from dataclasses import dataclass

TAG_TOKEN = re.compile(r"<\s*(/?)\s*([A-Za-z0-9_#-]+)(?:\s+[^<>]*?)?\s*(/?)>")
CONTROL_CHARS = bytes(range(0, 9)) + bytes(range(14, 32))


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
class DiffResult:
    left_only: list[str]
    right_only: list[str]
    changed: list[tuple[str, str, str]]
    unchanged_count: int


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
    result = FileResult(
        path=path,
        readable=False,
        leaf_records=[],
        warnings=[],
    )

    try:
        data = path.read_bytes()
    except Exception as exc:  # noqa: BLE001
        result.error = f"Cannot read file: {exc}"
        return result

    result.readable = True
    result.is_binary = detect_binary(data)
    if result.is_binary:
        result.error = "Binary content detected; diffing is text-only"
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


def diff_maps(left_map: dict[str, str], right_map: dict[str, str]) -> DiffResult:
    left_paths = set(left_map.keys())
    right_paths = set(right_map.keys())
    shared_paths = sorted(left_paths & right_paths)

    left_only = sorted(left_paths - right_paths)
    right_only = sorted(right_paths - left_paths)
    changed: list[tuple[str, str, str]] = []
    unchanged_count = 0

    for path in shared_paths:
        left_value = left_map[path]
        right_value = right_map[path]
        if left_value == right_value:
            unchanged_count += 1
        else:
            changed.append((path, left_value, right_value))

    return DiffResult(
        left_only=left_only,
        right_only=right_only,
        changed=changed,
        unchanged_count=unchanged_count,
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


def render_diff(diff: DiffResult, summary_only: bool, changed_only: bool) -> list[str]:
    lines: list[str] = []
    lines.append(f"LEFT_ONLY_COUNT: {len(diff.left_only)}")
    lines.append(f"RIGHT_ONLY_COUNT: {len(diff.right_only)}")
    lines.append(f"CHANGED_COUNT: {len(diff.changed)}")
    lines.append(f"UNCHANGED_COUNT: {diff.unchanged_count}")

    if summary_only:
        return lines

    if not changed_only:
        lines.append("LEFT_ONLY:")
        lines.extend(diff.left_only)
        lines.append("")
        lines.append("RIGHT_ONLY:")
        lines.extend(diff.right_only)
        lines.append("")

    lines.append("CHANGED:")
    for path, left_value, right_value in diff.changed:
        lines.append(f"{path}: {left_value} -> {right_value}")

    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description="Diff hierarchical RC0 paths and values without requiring valid XML")
    parser.add_argument("left", help="Left-hand RC0 file")
    parser.add_argument("right", help="Right-hand RC0 file")
    parser.add_argument(
        "--summary-only",
        action="store_true",
        help="Print only counts and file status, not detailed path listings",
    )
    parser.add_argument(
        "--changed-only",
        action="store_true",
        help="Print only changed paths plus summary counts",
    )
    args = parser.parse_args()

    left_result = inspect_file(pathlib.Path(args.left))
    right_result = inspect_file(pathlib.Path(args.right))

    output_lines: list[str] = []
    output_lines.extend(render_file_status("LEFT", left_result))
    output_lines.append("")
    output_lines.extend(render_file_status("RIGHT", right_result))
    output_lines.append("")

    if (not left_result.readable) or left_result.is_binary or (not right_result.readable) or right_result.is_binary:
        print("\n".join(output_lines).rstrip())
        return 1

    left_map = first_value_map(left_result.leaf_records or [])
    right_map = first_value_map(right_result.leaf_records or [])
    diff = diff_maps(left_map, right_map)

    output_lines.extend(render_diff(diff, summary_only=args.summary_only, changed_only=args.changed_only))
    print("\n".join(output_lines).rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
