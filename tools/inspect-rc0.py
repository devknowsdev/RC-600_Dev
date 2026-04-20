#!/usr/bin/env python3
"""
inspect-rc0.py — Read-only structural inspection for RC-600 .RC0 files.

This tool does not assume that .RC0 files are valid XML.
It detects whether a file is likely binary or text, and for text-like files it
reports XML-like structural clues without attempting schema-aware parsing.

Usage:
    python3 tools/inspect-rc0.py path/to/file.RC0 [more files ...]
    python3 tools/inspect-rc0.py --max-tags 50 path/to/file.RC0

Exit codes:
    0 — inspection completed for all readable files
    1 — one or more files could not be read

Notes:
- Binary detection is informational, not an error.
- Text/XML-like files may still be malformed as XML.
- Numeric tag names such as <0>...</0> are reported explicitly because they are
  not valid XML names under standard XML rules.
"""

from __future__ import annotations

import argparse
import collections
import pathlib
import re
import sys
from dataclasses import dataclass
from typing import Iterable

TAG_PATTERN = re.compile(r"<\s*(/?)\s*([A-Za-z0-9_#-]+)(?:\s+[^<>]*?)?\s*(/?)>")
XML_DECL_PATTERN = re.compile(r"<\?xml\b", re.IGNORECASE)
ROOT_OPEN_PATTERN = re.compile(r"<database\b", re.IGNORECASE)
ROOT_CLOSE_PATTERN = re.compile(r"</database\s*>", re.IGNORECASE)
CONTROL_CHARS = bytes(range(0, 9)) + bytes(range(14, 32))


@dataclass
class InspectionResult:
    path: pathlib.Path
    readable: bool
    is_binary: bool = False
    size_bytes: int = 0
    encoding_used: str | None = None
    has_xml_declaration: bool = False
    has_database_open: bool = False
    has_database_close: bool = False
    content_after_database_close: bool = False
    tag_counts: collections.Counter[str] | None = None
    numeric_tag_names: list[str] | None = None
    top_level_open_tags: list[str] | None = None
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


def extract_tag_info(text: str) -> tuple[collections.Counter[str], list[str], list[str]]:
    counts: collections.Counter[str] = collections.Counter()
    numeric_names: set[str] = set()
    top_level_opens: list[str] = []
    depth = 0

    for match in TAG_PATTERN.finditer(text):
        is_close = bool(match.group(1))
        name = match.group(2)
        is_self_closing = bool(match.group(3))

        counts[name] += 1
        if name and name[0].isdigit():
            numeric_names.add(name)

        if not is_close:
            if depth == 0:
                top_level_opens.append(name)
            if not is_self_closing:
                depth += 1
        else:
            depth = max(depth - 1, 0)

    return counts, sorted(numeric_names), top_level_opens


def inspect_file(path: pathlib.Path) -> InspectionResult:
    result = InspectionResult(
        path=path,
        readable=False,
        warnings=[],
        tag_counts=collections.Counter(),
        numeric_tag_names=[],
        top_level_open_tags=[],
    )

    try:
        data = path.read_bytes()
    except Exception as exc:  # noqa: BLE001
        result.error = f"Cannot read file: {exc}"
        return result

    result.readable = True
    result.size_bytes = len(data)
    result.is_binary = detect_binary(data)

    if result.is_binary:
        return result

    text, encoding = decode_text(data)
    if text is None:
        result.error = "Unable to decode text content using supported encodings"
        return result

    result.encoding_used = encoding
    result.has_xml_declaration = bool(XML_DECL_PATTERN.search(text))
    result.has_database_open = bool(ROOT_OPEN_PATTERN.search(text))
    result.has_database_close = bool(ROOT_CLOSE_PATTERN.search(text))

    counts, numeric_names, top_level_opens = extract_tag_info(text)
    result.tag_counts = counts
    result.numeric_tag_names = numeric_names
    result.top_level_open_tags = top_level_opens

    if result.has_database_close:
        close_match = None
        for close_match in ROOT_CLOSE_PATTERN.finditer(text):
            pass
        if close_match is not None:
            trailing = text[close_match.end():].strip()
            result.content_after_database_close = bool(trailing)
            if trailing:
                result.warnings.append(
                    "Content exists after closing </database> tag; file is XML-like but not a single-root XML document"
                )

    if numeric_names:
        result.warnings.append(
            "Numeric tag names detected; file is XML-like but not valid standard XML"
        )

    if result.has_xml_declaration and not result.has_database_open:
        result.warnings.append(
            "XML declaration present but no <database> root-like tag detected"
        )

    return result


def format_top_counts(counter: collections.Counter[str], max_tags: int) -> Iterable[str]:
    for name, count in counter.most_common(max_tags):
        yield f"  - {name}: {count}"


def render_result(result: InspectionResult, max_tags: int) -> str:
    lines: list[str] = []
    lines.append(f"FILE: {result.path}")

    if not result.readable:
        lines.append(f"  status: error")
        lines.append(f"  error: {result.error}")
        return "\n".join(lines)

    lines.append("  status: ok")
    lines.append(f"  size_bytes: {result.size_bytes}")
    lines.append(f"  type: {'binary' if result.is_binary else 'text-like'}")

    if result.is_binary:
        lines.append("  note: binary content detected; not attempting text/XML inspection")
        return "\n".join(lines)

    lines.append(f"  encoding_used: {result.encoding_used}")
    lines.append(f"  has_xml_declaration: {str(result.has_xml_declaration).lower()}")
    lines.append(f"  has_database_open: {str(result.has_database_open).lower()}")
    lines.append(f"  has_database_close: {str(result.has_database_close).lower()}")
    lines.append(
        f"  content_after_database_close: {str(result.content_after_database_close).lower()}"
    )

    if result.top_level_open_tags:
        preview = ", ".join(result.top_level_open_tags[:10])
        lines.append(f"  top_level_open_tags: {preview}")

    if result.numeric_tag_names:
        preview = ", ".join(result.numeric_tag_names[:20])
        lines.append(f"  numeric_tag_names: {preview}")

    if result.tag_counts:
        lines.append("  top_tag_counts:")
        lines.extend(format_top_counts(result.tag_counts, max_tags))

    if result.warnings:
        lines.append("  warnings:")
        for warning in result.warnings:
            lines.append(f"  - {warning}")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect RC-600 .RC0 files without assuming valid XML")
    parser.add_argument("paths", nargs="+", help="One or more .RC0 files to inspect")
    parser.add_argument(
        "--max-tags",
        type=int,
        default=25,
        help="Maximum number of tag-frequency entries to print per file (default: 25)",
    )
    args = parser.parse_args()

    exit_code = 0
    for raw_path in args.paths:
        path = pathlib.Path(raw_path)
        result = inspect_file(path)
        print(render_result(result, max_tags=max(args.max_tags, 1)))
        print()
        if not result.readable:
            exit_code = 1

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
