#!/usr/bin/env python3
"""
extract-rc0-paths.py — Extract deterministic hierarchical paths from RC-600 .RC0 files.

This tool is intentionally read-only and does not require the input to be valid XML.
It operates on text-like RC0 files using a simple tag scanner and stack-based path
tracking so it can handle XML-like RC0 structures that include non-standard tag
names such as <0>...</0>.

Usage:
    python3 tools/extract-rc0-paths.py path/to/file.RC0
    python3 tools/extract-rc0-paths.py --include-values file1.RC0 file2.RC0
    python3 tools/extract-rc0-paths.py --summary-only file.RC0

Exit codes:
    0 — extraction completed for all readable files
    1 — one or more files could not be read or were binary / undecodable

Notes:
- Binary files are reported and skipped.
- Paths preserve the observed tag hierarchy exactly.
- Leaf values are emitted only when --include-values is set.
- No semantic names are inferred for short field tags like A/B/C.
"""

from __future__ import annotations

import argparse
import collections
import pathlib
import re
import sys
from dataclasses import dataclass
from typing import Iterable

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
    root_paths: list[str] | None = None
    leaf_records: list[LeafRecord] | None = None
    warnings: list[str] | None = None
    error: str | None = None


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
    compact = re.sub(r"\s+", " ", value.strip())
    return compact


def extract_paths(text: str) -> tuple[list[str], list[LeafRecord], list[str]]:
    stack: list[str] = []
    root_paths: list[str] = []
    leaf_records: list[LeafRecord] = []
    warnings: list[str] = []

    matches = list(TAG_TOKEN.finditer(text))
    for index, match in enumerate(matches):
        is_close = bool(match.group(1))
        tag_name = match.group(2)
        is_self_closing = bool(match.group(3))

        if not is_close:
            if not stack:
                root_paths.append(tag_name)
            stack.append(tag_name)

            next_start = matches[index + 1].start() if index + 1 < len(matches) else len(text)
            inner_text = text[match.end():next_start]
            compact_value = normalize_scalar_value(inner_text)

            if compact_value and len(stack) > 0:
                leaf_records.append(LeafRecord(path="/".join(stack), value=compact_value))

            if tag_name and tag_name[0].isdigit():
                warnings.append(f"Numeric tag name observed in path: {'/'.join(stack)}")

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

    return root_paths, leaf_records, warnings


def inspect_file(path: pathlib.Path) -> FileResult:
    result = FileResult(
        path=path,
        readable=False,
        root_paths=[],
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
        result.error = "Binary content detected; path extraction is text-only"
        return result

    text, encoding = decode_text(data)
    if text is None:
        result.error = "Unable to decode text content using supported encodings"
        return result

    result.encoding_used = encoding
    root_paths, leaf_records, warnings = extract_paths(text)
    result.root_paths = root_paths
    result.leaf_records = leaf_records
    result.warnings = warnings
    return result


def summarize_leaf_paths(leaf_records: list[LeafRecord]) -> tuple[int, int, list[str]]:
    unique_paths = sorted({record.path for record in leaf_records})
    numeric_paths = [path for path in unique_paths if any(part and part[0].isdigit() for part in path.split('/'))]
    return len(leaf_records), len(unique_paths), numeric_paths


def render_file_result(result: FileResult, include_values: bool, summary_only: bool) -> str:
    lines: list[str] = []
    lines.append(f"FILE: {result.path}")

    if not result.readable:
        lines.append("STATUS: error")
        lines.append(f"ERROR: {result.error}")
        return "\n".join(lines)

    if result.is_binary:
        lines.append("STATUS: binary")
        lines.append(f"ERROR: {result.error}")
        return "\n".join(lines)

    lines.append("STATUS: ok")
    lines.append(f"ENCODING: {result.encoding_used}")

    root_preview = ", ".join(result.root_paths or [])
    lines.append(f"ROOTS: {root_preview}")

    leaf_count, unique_count, numeric_paths = summarize_leaf_paths(result.leaf_records or [])
    lines.append(f"LEAF_COUNT: {leaf_count}")
    lines.append(f"UNIQUE_PATH_COUNT: {unique_count}")
    lines.append(f"NUMERIC_PATH_COUNT: {len(numeric_paths)}")

    if result.warnings:
        lines.append("WARNINGS:")
        for warning in result.warnings[:50]:
            lines.append(f"- {warning}")

    if summary_only:
        return "\n".join(lines)

    lines.append("PATHS:")
    seen = set()
    for record in result.leaf_records or []:
        if record.path in seen:
            continue
        seen.add(record.path)
        if include_values:
            first_value = next(r.value for r in result.leaf_records if r.path == record.path)
            lines.append(f"{record.path} = {first_value}")
        else:
            lines.append(record.path)

    return "\n".join(lines)


def render_multi_file_summary(results: list[FileResult]) -> str:
    valid_results = [r for r in results if r.readable and not r.is_binary and r.leaf_records is not None]
    if len(valid_results) < 2:
        return ""

    path_sets = {str(result.path): {record.path for record in result.leaf_records or []} for result in valid_results}
    common_paths = set.intersection(*path_sets.values()) if path_sets else set()
    all_paths = set.union(*path_sets.values()) if path_sets else set()

    lines = []
    lines.append("CROSS_FILE_SUMMARY:")
    lines.append(f"FILES_COMPARED: {len(valid_results)}")
    lines.append(f"COMMON_PATHS: {len(common_paths)}")
    lines.append(f"UNION_PATHS: {len(all_paths)}")

    for path_str, paths in path_sets.items():
        only_here = len(paths - common_paths)
        lines.append(f"ONLY_IN_FILE[{path_str}]: {only_here}")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract deterministic RC0 hierarchical paths without requiring valid XML")
    parser.add_argument("paths", nargs="+", help="One or more .RC0 files to inspect")
    parser.add_argument(
        "--include-values",
        action="store_true",
        help="Include first observed scalar value for each unique path",
    )
    parser.add_argument(
        "--summary-only",
        action="store_true",
        help="Print only file summaries, not full path listings",
    )
    args = parser.parse_args()

    results = []
    exit_code = 0

    for raw_path in args.paths:
        result = inspect_file(pathlib.Path(raw_path))
        results.append(result)
        print(render_file_result(result, include_values=args.include_values, summary_only=args.summary_only))
        print()
        if (not result.readable) or result.is_binary:
            exit_code = 1

    summary = render_multi_file_summary(results)
    if summary:
        print(summary)

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
