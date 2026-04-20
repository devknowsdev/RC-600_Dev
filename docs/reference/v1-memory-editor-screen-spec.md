---
id: ref-v1-memory-editor-screen-spec
title: V1 memory editor screen spec
surface: reference
firmware_version: "1.3"
evidence: inference
confidence: medium
last_verified: 2026-04-20
related:
  - ref-v1-memory-model
  - meta-working-history-roadmap
---

# V1 memory editor screen spec

This file defines the first Mac UI screen for the RC-600 editor.

It is intentionally modular. The goal is to prevent monolithic UI code and keep the app easy to change as parameter mappings improve.

## Scope

This screen covers the V1 memory sections defined in `docs/reference/v1-memory-model.yaml`:

- Memory Name
- Tracks
- Record
- Playback
- Rhythm

Deferred from this screen:

- Input FX deep editing
- Track FX deep editing
- Assign editing
- Internal/external control editing
- Global/system editing

## Primary design goals

- One memory should be understandable at a glance.
- Every major section should be isolated into its own component.
- Field rendering should be generic and schema-driven.
- Visual components must not contain RC-600-specific mapping logic.
- Confidence and mapping status should be visible in the UI.

## Screen layout

The V1 memory editor uses a three-panel layout.

### Left panel: memory navigator

Purpose:

- Show available memories
- Select current memory
- Support future set-list workflows

Contents:

- Search/filter input
- Memory list
- Current memory highlight
- Optional status chip per memory:
  - edited
  - mapped partially
  - export-ready

### Center panel: memory editor

Purpose:

- Edit the currently selected memory

Sections in order:

1. Memory Name
2. Tracks
3. Record
4. Playback
5. Rhythm

Behavior:

- Sections are vertically stacked
- Each section is independently collapsible
- Each section owns only layout and grouping, not parsing logic

### Right panel: summary and confidence

Purpose:

- Explain the performance meaning of the current memory
- Surface confidence without exposing raw internals by default

Contents:

- Performance summary
- Mapping confidence summary
- Open questions / unmapped warning area

Example summary lines:

- Tracks 1 and 2 configured for single-track behavior
- Tracks 5 and 6 configured as one-shot tracks
- Rhythm starts with recording
- Some track mappings remain provisional

## Modular component split

The first implementation should be split into separate modules.

### App shell

Responsibility:

- high-level layout only
- no parameter rendering

Suggested file:

- `src/app/AppShell.tsx`

### Memory editor route/container

Responsibility:

- loads current memory data
- passes section-specific slices downward
- coordinates save state

Suggested file:

- `src/features/memory-editor/MemoryEditorScreen.tsx`

### Left panel components

Suggested files:

- `src/features/memory-list/MemoryListPanel.tsx`
- `src/features/memory-list/MemoryListItem.tsx`
- `src/features/memory-list/MemorySearchInput.tsx`

### Section containers

Suggested files:

- `src/features/memory-editor/sections/MemoryNameSection.tsx`
- `src/features/memory-editor/sections/TracksSection.tsx`
- `src/features/memory-editor/sections/RecordSection.tsx`
- `src/features/memory-editor/sections/PlaybackSection.tsx`
- `src/features/memory-editor/sections/RhythmSection.tsx`

These components should:

- receive field definitions and values
- group them visually
- delegate actual control rendering to reusable field components

### Reusable field renderer layer

Suggested files:

- `src/components/fields/FieldRenderer.tsx`
- `src/components/fields/EnumField.tsx`
- `src/components/fields/ToggleField.tsx`
- `src/components/fields/NumericField.tsx`
- `src/components/fields/TextField.tsx`
- `src/components/fields/GroupedField.tsx`
- `src/components/fields/FieldStatusBadge.tsx`

These components must not know about specific RC-600 blocks such as TRACK or RHYTHM.

They should render based on schema metadata only.

### Summary panel

Suggested files:

- `src/features/memory-summary/MemorySummaryPanel.tsx`
- `src/features/memory-summary/buildMemorySummary.ts`

Important split:

- UI component renders summary
- summary builder converts memory state into human-readable lines

### Schema/model adapter layer

Suggested files:

- `src/features/schema/loadMemoryModel.ts`
- `src/features/schema/memoryModelTypes.ts`
- `src/features/schema/selectSectionFields.ts`

Responsibility:

- load `v1-memory-model.yaml`
- normalize schema shape
- expose section/field lookups to UI

### State layer

Suggested files:

- `src/features/memory-editor/state/memoryEditorStore.ts`
- `src/features/memory-editor/state/memoryEditorActions.ts`
- `src/features/memory-editor/state/memoryEditorSelectors.ts`

Responsibility:

- current memory selection
- pending edits
- dirty state
- validation state

### Parser / mapping adapter layer

Suggested files:

- `src/features/rc600/rc0/rc0Types.ts`
- `src/features/rc600/rc0/mapCanonicalToMemory.ts`
- `src/features/rc600/rc0/mapMemoryToCanonical.ts`

Responsibility:

- conversion between raw RC0/XML structures and canonical memory model
- no UI code here

## Section-level behavior

### 1. Memory Name section

Controls:

- text input

Displays:

- character count
- mapping badge

### 2. Tracks section

Structure:

- six repeated track cards or tabs

Each track subview should show:

- Reverse
- One Shot
- Pan
- Play Level
- Start Mode
- Stop Mode
- Dub Mode
- FX
- Play Mode
- Measure
- Loop Sync
- Loop Sync Mode
- Tempo Sync
- Tempo Sync Mode
- Speed
- Bounce In
- Input Sources

Track UI should be split into subsections if needed:

- Playback Behavior
- Sync and Timing
- Inputs

### 3. Record section

Controls:

- Rec Action
- Quantize
- Auto Rec
- Auto Rec Sensitivity
- Bounce
- Bounce Track

### 4. Playback section

Controls:

- Single Track Change
- Current Track
- Fade Time In
- Fade Time Out
- All Start
- All Stop
- Loop Length
- Speed Change
- Sync Adjust

### 5. Rhythm section

Controls:

- Genre
- Pattern
- Variation
- Kit
- Beat
- Start Trigger
- Stop Trigger
- Intro on Record
- Intro on Play
- Ending
- Fill
- Variation Change

## Status and confidence display

Every field row should be able to show a small status badge.

Supported badges:

- Confirmed
- Provisional
- Unknown

Source:

- `mapping_status` from `v1-memory-model.yaml`

The badge renderer must be shared, not duplicated per section.

## Non-monolithic implementation rules

1. No single file should define the entire editor screen and all field logic.
2. No section component should directly parse raw RC0/XML.
3. No reusable field component should contain section-specific logic.
4. Summary generation must live outside visual components.
5. Schema loading must live outside visual components.
6. Mapping conversion must live outside visual components.
7. Future AI commands must target canonical field IDs, not component names.

## Future extension points

These should be anticipated now but not implemented in V1:

- set-list mode
- natural language command bar
- diff view between memories
- validation panel
- export readiness check
- provisional mapping inspection drawer

## Recommended implementation order

1. App shell
2. Memory editor screen container
3. Schema loader
4. Reusable field renderer layer
5. Memory Name section
6. Tracks section
7. Record section
8. Playback section
9. Rhythm section
10. Summary panel
11. Raw RC0/XML adapter layer

## Minimum acceptable first prototype

The first working prototype should:

- render one selected memory
- render all five V1 sections
- use reusable field components
- show field status badges
- avoid embedding RC-600 mapping assumptions in visual files

That is enough to validate the structure before export logic or AI control are added.
