#!/usr/bin/env python3
"""
check-rc0-mappings.py — Validate extracted parameter YAML against observed RC0 structure.

This tool is intentionally read-only and does not require RC0 inputs to be valid XML.
It compares a parameter extraction YAML file against observed RC0 candidate path
families derived directly from two RC0 files.

Goal:
- preserve uncertainty
- detect structural support vs lack of support
- flag suspiciously specific mapping claims
- avoid semantic guessing about short leaf tags such as A/B/C

Usage:
    python3 tools/check-rc0-mappings.py params.yaml left.RC0 right.RC0

Exit codes:
    0 — validation completed successfully
    1 — YAML unreadable/invalid, RC0 unreadable/binary/undecodable, or PyYAML missing

Notes:
- Broad scopes such as TRACK1–TRACK6 are treated as structural claims only.
- Repeated RC0 families like database/mem/TRACK*/J provide structural support,
  not semantic confirmation of a specific parameter name.
- Highly specific xml_path claims with no observed structural support are flagged
  as suspicious.
"""

from __future__ import annotations

import argparse
import collections
import pathlib
import re
import sys
from dataclasses import dataclass

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. pip install pyyaml", file=sys.stderr)
    sys.exit(1)

TAG_TOKEN = re.compile(r"<\s*(/?)\s*([A-Za-z0-9_#-]+)(?:\s+[^<>]*?)?\s*(/?)>")
CONTROL_CHARS = bytes(range(0, 9)) + bytes(range(14, 32))
TRACK_SECTION_RE = re.compile(r"^TRACK\d+$")
TRACK_RANGE_RE = re.compile(r"^TRACK\d+[–-]TRACK\d+$")
SPECIFIC_TRACK_RE = re.compile(r"^TRACK\d+$")


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
class MappingAssessment:
    name: str
    xml_path: str | None
    evidence: str | None
    note: str | None
    rationale: str


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
        result.error = "Binary content detected; mapping validation is text-only"
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


def candidate_family_for_path(path: str) -> str:
    parts = path.split('/')
    if len(parts) < 4:
        return path
    if parts[0] == 'database' and parts[1] == 'mem' and TRACK_SECTION_RE.match(parts[2]):
        return f"database/mem/TRACK*/{parts[3]}"
    if parts[0] == 'database' and parts[1] == 'mem':
        return f"database/mem/{parts[2]}/{parts[3]}"
    if parts[0] == 'database' and parts[1] in {'ifx', 'tfx'}:
        return f"database/{parts[1]}/{parts[2]}/*"
    return path


def load_yaml_parameters(path: pathlib.Path) -> list[dict]:
    try:
        content = path.read_text(encoding='utf-8')
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Cannot read YAML file: {exc}") from exc

    try:
        data = yaml.safe_load(content)
    except yaml.YAMLError as exc:
        raise ValueError(f"YAML parse error: {exc}") from exc

    if not isinstance(data, dict):
        raise ValueError('YAML root must be a mapping')

    parameters = data.get('parameters')
    if not isinstance(parameters, list):
        raise ValueError("YAML file must contain a top-level 'parameters' list")

    normalized = []
    for item in parameters:
        if not isinstance(item, dict):
            continue
        normalized.append(item)
    return normalized


def scope_for_xml_path(xml_path: str | None) -> str | None:
    if not xml_path or not isinstance(xml_path, str):
        return None
    value = xml_path.strip()
    if TRACK_RANGE_RE.match(value):
        return 'database/mem/TRACK*/'
    if SPECIFIC_TRACK_RE.match(value):
        return f"database/mem/{value}/"
    upper = value.upper()
    if upper in {'PLAY', 'REC', 'MASTER', 'RHYTHM', 'NAME', 'INPUT', 'OUTPUT', 'ROUTING', 'MIXER'}:
        return f"database/mem/{upper}/"
    return None


def classify_parameter(param: dict, candidate_families: set[str]) -> tuple[str, MappingAssessment]:
    name = str(param.get('name', '<unnamed>'))
    xml_path = param.get('xml_path')
    evidence = param.get('evidence')
    note = param.get('note')

    scope = scope_for_xml_path(xml_path if isinstance(xml_path, str) else None)

    if xml_path and isinstance(xml_path, str) and scope is None:
        assessment = MappingAssessment(
            name=name,
            xml_path=xml_path,
            evidence=str(evidence) if evidence is not None else None,
            note=str(note) if note is not None else None,
            rationale='xml_path is highly specific or non-standard and has no supported structural scope rule',
        )
        return 'SUSPICIOUS', assessment

    if scope is None:
        assessment = MappingAssessment(
            name=name,
            xml_path=xml_path if isinstance(xml_path, str) else None,
            evidence=str(evidence) if evidence is not None else None,
            note=str(note) if note is not None else None,
            rationale='no xml_path scope declared, so RC0 structural comparison is not possible',
        )
        return 'UNMAPPED', assessment

    matching_families = sorted(family for family in candidate_families if family.startswith(scope))

    if TRACK_RANGE_RE.match(str(xml_path)):
        if matching_families:
            assessment = MappingAssessment(
                name=name,
                xml_path=str(xml_path),
                evidence=str(evidence) if evidence is not None else None,
                note=str(note) if note is not None else None,
                rationale=f"broad track scope has structural support from observed candidate families: {', '.join(matching_families)}",
            )
            return 'PLAUSIBLE', assessment
        assessment = MappingAssessment(
            name=name,
            xml_path=str(xml_path),
            evidence=str(evidence) if evidence is not None else None,
            note=str(note) if note is not None else None,
            rationale='broad track scope has no observed changed RC0 candidate family under database/mem/TRACK*/',
        )
        return 'UNMAPPED', assessment

    if SPECIFIC_TRACK_RE.match(str(xml_path)):
        if matching_families:
            assessment = MappingAssessment(
                name=name,
                xml_path=str(xml_path),
                evidence=str(evidence) if evidence is not None else None,
                note=str(note) if note is not None else None,
                rationale=f"specific track scope has structural support from observed candidate families: {', '.join(matching_families)}",
            )
            return 'CONFIRMED', assessment
        assessment = MappingAssessment(
            name=name,
            xml_path=str(xml_path),
            evidence=str(evidence) if evidence is not None else None,
            note=str(note) if note is not None else None,
            rationale='specific track scope is declared but no observed changed RC0 candidate family exists under that scope',
        )
        return 'SUSPICIOUS', assessment

    if matching_families:
        assessment = MappingAssessment(
            name=name,
            xml_path=str(xml_path),
            evidence=str(evidence) if evidence is not None else None,
            note=str(note) if note is not None else None,
            rationale=f"memory-level scope has structural support from observed candidate families: {', '.join(matching_families)}",
        )
        return 'PLAUSIBLE', assessment

    assessment = MappingAssessment(
        name=name,
        xml_path=str(xml_path),
        evidence=str(evidence) if evidence is not None else None,
        note=str(note) if note is not None else None,
        rationale='declared memory-level scope has no observed changed RC0 candidate family',
    )
    return 'UNMAPPED', assessment


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
        for warning in result.warnings[:20]:
            lines.append(f"- {warning}")
    return lines


def render_assessment_section(title: str, items: list[MappingAssessment]) -> list[str]:
    lines = [f"{title}:"]
    if not items:
        lines.append('- none')
        return lines
    for item in items:
        lines.append(f"- {item.name}")
        lines.append(f"  xml_path: {item.xml_path}")
        lines.append(f"  evidence: {item.evidence}")
        if item.note:
            lines.append(f"  note: {item.note}")
        lines.append(f"  rationale: {item.rationale}")
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description='Validate parameter YAML against observed RC0 structural candidates')
    parser.add_argument('yaml_file', help='Extracted parameter YAML file')
    parser.add_argument('left', help='Left-hand RC0 file')
    parser.add_argument('right', help='Right-hand RC0 file')
    args = parser.parse_args()

    yaml_path = pathlib.Path(args.yaml_file)
    try:
        parameters = load_yaml_parameters(yaml_path)
    except ValueError as exc:
        print(f"YAML_ERROR: {exc}")
        return 1

    left_result = inspect_file(pathlib.Path(args.left))
    right_result = inspect_file(pathlib.Path(args.right))

    output_lines: list[str] = []
    output_lines.append(f"YAML_FILE: {yaml_path}")
    output_lines.append(f"PARAMETER_COUNT: {len(parameters)}")
    output_lines.append('')
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
    candidate_families = {candidate_family_for_path(path) for path in changed}

    confirmed: list[MappingAssessment] = []
    plausible: list[MappingAssessment] = []
    unmapped: list[MappingAssessment] = []
    suspicious: list[MappingAssessment] = []

    for param in parameters:
        status, assessment = classify_parameter(param, candidate_families)
        if status == 'CONFIRMED':
            confirmed.append(assessment)
        elif status == 'PLAUSIBLE':
            plausible.append(assessment)
        elif status == 'UNMAPPED':
            unmapped.append(assessment)
        elif status == 'SUSPICIOUS':
            suspicious.append(assessment)

    output_lines.extend(render_assessment_section('CONFIRMED_STRUCTURE_MATCHES', confirmed))
    output_lines.append('')
    output_lines.extend(render_assessment_section('PLAUSIBLE_BUT_UNCONFIRMED', plausible))
    output_lines.append('')
    output_lines.extend(render_assessment_section('UNMAPPED_PARAMETERS', unmapped))
    output_lines.append('')
    output_lines.extend(render_assessment_section('SUSPICIOUS_MAPPINGS', suspicious))
    output_lines.append('')
    output_lines.append('SUMMARY:')
    output_lines.append(f"- confirmed_structure_matches: {len(confirmed)}")
    output_lines.append(f"- plausible_but_unconfirmed: {len(plausible)}")
    output_lines.append(f"- unmapped_parameters: {len(unmapped)}")
    output_lines.append(f"- suspicious_mappings: {len(suspicious)}")
    output_lines.append(f"- observed_candidate_families: {len(candidate_families)}")

    print('\n'.join(output_lines).rstrip())
    return 0


if __name__ == '__main__':
    sys.exit(main())
