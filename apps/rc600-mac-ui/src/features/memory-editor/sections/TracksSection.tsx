import { useState, useMemo } from 'react'
import { TrackCard } from './TrackCard'
import type { TrackState } from './TrackCard'
import type { MemoryModel, MemoryField } from '../../../features/schema/memoryModelTypes'

type Props = {
  model: MemoryModel
  onTracksChange?: (tracks: TrackState[]) => void
}

// Build initial track state from schema field definitions.
// Defaults come from the field type: boolean fields → false, enum fields → first value.
function buildInitialTrackState(fields: MemoryField[]): TrackState {
  const state: TrackState = {}
  for (const field of fields) {
    if (!field.type) continue
    if (
      field.type === 'enum' &&
      Array.isArray(field.values) &&
      field.values.length === 2 &&
      field.values.includes('OFF') &&
      field.values.includes('ON')
    ) {
      state[field.canonical_id] = false
    } else if (field.type === 'enum' && Array.isArray(field.values) && field.values.length > 0) {
      state[field.canonical_id] = field.values[0]
    } else if (field.type === 'integer' || field.type === 'range') {
      state[field.canonical_id] = 0
    } else if (field.type === 'string') {
      state[field.canonical_id] = ''
    }
  }
  return state
}

export function TracksSection({ model, onTracksChange }: Props) {
  const trackFields = useMemo(() => {
    const section = model?.memory_sections?.find((s) => s.id === 'tracks')
    return section?.fields ?? []
  }, [model])

  const [tracks, setTracks] = useState<TrackState[]>(() =>
    Array.from({ length: 6 }, () => buildInitialTrackState(trackFields))
  )

  function updateTrack(index: number, canonicalId: string, value: unknown) {
    const next = tracks.map((t, i) =>
      i === index ? { ...t, [canonicalId]: value } : t
    )
    setTracks(next)
    onTracksChange?.(next)
  }

  return (
    <section style={{ marginTop: 20 }}>
      <h2>Tracks</h2>
      {tracks.map((trackState, i) => (
        <TrackCard
          key={i}
          trackIndex={i + 1}
          fields={trackFields}
          state={trackState}
          onFieldChange={(id, value) => updateTrack(i, id, value)}
        />
      ))}
    </section>
  )
}
