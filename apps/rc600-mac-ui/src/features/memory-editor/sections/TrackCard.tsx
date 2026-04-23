// TrackCard renders a single track's parameters from schema fields.
// All field rendering is delegated to FieldRenderer — no RC-600-specific
// dispatch or canonical_id switches here.

import { FieldRenderer } from '../../../components/fields/FieldRenderer'
import type { MemoryField } from '../../../features/schema/memoryModelTypes'

export type TrackState = {
  [canonicalId: string]: unknown
}

type Props = {
  trackIndex: number
  fields: MemoryField[]
  state: TrackState
  onFieldChange: (canonicalId: string, value: unknown) => void
}

// Field grouping: which canonical_ids belong to which subsection.
// These are the only RC-600-specific names in this file — they define
// layout grouping, not rendering logic.
const PLAYBACK_FIELDS = [
  'track.reverse',
  'track.one_shot',
  'track.play_mode',
  'track.dub_mode',
  'track.fx_enabled',
  'track.speed',
]

const TIMING_FIELDS = [
  'track.start_mode',
  'track.stop_mode',
  'track.measure',
  'track.bounce_in',
]

const SYNC_FIELDS = [
  'track.loop_sync_sw',
  'track.loop_sync_mode',
  'track.tempo_sync_sw',
  'track.tempo_sync_mode',
]

const INPUT_SOURCE_FIELDS = [
  'track.input_sources.mic_1',
  'track.input_sources.mic_2',
  'track.input_sources.inst1_left',
  'track.input_sources.inst1_right',
  'track.input_sources.inst2_left',
  'track.input_sources.inst2_right',
  'track.input_sources.rhythm',
]

export function TrackCard({ trackIndex, fields, state, onFieldChange }: Props) {
  const playbackFields = fields.filter((f) => PLAYBACK_FIELDS.includes(f.canonical_id))
  const timingFields = fields.filter((f) => TIMING_FIELDS.includes(f.canonical_id))
  const syncFields = fields.filter((f) => SYNC_FIELDS.includes(f.canonical_id))
  const inputSourceFields = fields.filter((f) => INPUT_SOURCE_FIELDS.includes(f.canonical_id))
  // Any field not in a named group falls through to a catch-all section
  const knownIds = [...PLAYBACK_FIELDS, ...TIMING_FIELDS, ...SYNC_FIELDS, ...INPUT_SOURCE_FIELDS]
  const otherFields = fields.filter((f) => !knownIds.includes(f.canonical_id))

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 12 }}>
      <h4 style={{ marginTop: 0 }}>Track {trackIndex}</h4>

      {playbackFields.length > 0 && (
        <Subsection title="Playback">
          {playbackFields.map((field) => (
            <FieldRenderer
              key={field.canonical_id}
              field={field}
              value={state[field.canonical_id]}
              onChange={(v) => onFieldChange(field.canonical_id, v)}
            />
          ))}
        </Subsection>
      )}

      {timingFields.length > 0 && (
        <Subsection title="Timing">
          {timingFields.map((field) => (
            <FieldRenderer
              key={field.canonical_id}
              field={field}
              value={state[field.canonical_id]}
              onChange={(v) => onFieldChange(field.canonical_id, v)}
            />
          ))}
        </Subsection>
      )}

      {syncFields.length > 0 && (
        <Subsection title="Sync">
          {syncFields.map((field) => (
            <FieldRenderer
              key={field.canonical_id}
              field={field}
              value={state[field.canonical_id]}
              onChange={(v) => onFieldChange(field.canonical_id, v)}
            />
          ))}
        </Subsection>
      )}

      {inputSourceFields.length > 0 && (
        <Subsection title="Input Sources">
          {inputSourceFields.map((field) => (
            <FieldRenderer
              key={field.canonical_id}
              field={field}
              value={state[field.canonical_id]}
              onChange={(v) => onFieldChange(field.canonical_id, v)}
            />
          ))}
        </Subsection>
      )}

      {otherFields.length > 0 && (
        <Subsection title="Other">
          {otherFields.map((field) => (
            <FieldRenderer
              key={field.canonical_id}
              field={field}
              value={state[field.canonical_id]}
              onChange={(v) => onFieldChange(field.canonical_id, v)}
            />
          ))}
        </Subsection>
      )}
    </div>
  )
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#555' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}
