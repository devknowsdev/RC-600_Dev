import { useEffect, useState } from 'react'
import { loadMemoryModel } from '../schema/loadMemoryModel'
import { MemoryNameSection } from './sections/MemoryNameSection'
import { TracksSection } from './sections/TracksSection'
import { RecordSection } from './sections/RecordSection'
import { PlaybackSection } from './sections/PlaybackSection'
import { RhythmSection } from './sections/RhythmSection'
import { TrackRoutingSection } from './sections/TrackRoutingSection'
import { MemorySummaryPanel } from '../memory-summary/MemorySummaryPanel'
import { buildInitialCanonicalState } from '../memory-summary/buildMemorySummary'
import { buildInitialSectionState } from '../schema/memoryModelTypes'
import type { MemoryModel, SectionState } from '../schema/memoryModelTypes'
import type { TrackState } from './sections/TrackCard'
import type { CanonicalMemoryState } from '../memory-summary/buildMemorySummary'

export function MemoryEditorScreen() {
  const [model, setModel]   = useState<MemoryModel | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [memory, setMemory] = useState<CanonicalMemoryState>(buildInitialCanonicalState)

  useEffect(() => {
    loadMemoryModel()
      .then((m) => {
        setModel(m)
        const section = (id: string) => m.memory_sections.find((s) => s.id === id)?.fields ?? []
        const routingFields = section('routing_track')
        setMemory({
          name: '',
          tracks: [],
          rec:    buildInitialSectionState(section('rec')),
          play:   buildInitialSectionState(section('play')),
          rhythm: buildInitialSectionState(section('rhythm')),
          trackRouting: Array.from({ length: 6 }, () => {
            // Default: all outputs ON (factory default)
            const s = buildInitialSectionState(routingFields)
            // Override boolean defaults to true (ON) since factory default is all-on
            for (const f of routingFields) {
              if (f.type === 'enum' && f.values?.includes('ON') && f.values?.includes('OFF')) {
                s[f.canonical_id] = true
              }
            }
            return s
          }),
        })
      })
      .catch((err) => setError(String(err)))
  }, [])

  function handleNameChange(name: string) {
    setMemory((prev) => ({ ...prev, name }))
  }

  function handleTracksChange(tracks: TrackState[]) {
    setMemory((prev) => ({ ...prev, tracks }))
  }

  function handleSectionChange(key: keyof Pick<CanonicalMemoryState, 'rec' | 'play' | 'rhythm'>) {
    return (canonicalId: string, value: unknown) => {
      setMemory((prev) => ({
        ...prev,
        [key]: { ...(prev[key] as SectionState), [canonicalId]: value },
      }))
    }
  }

  function handleTrackRoutingChange(trackIndex: number, canonicalId: string, value: unknown) {
    setMemory((prev) => {
      const next = [...prev.trackRouting]
      next[trackIndex] = { ...next[trackIndex], [canonicalId]: value }
      return { ...prev, trackRouting: next }
    })
  }

  if (error) return <div style={{ padding: 20, color: 'red' }}>Failed to load schema: {error}</div>
  if (!model) return <div style={{ padding: 20 }}>Loading...</div>

  return (
    <div style={{ display: 'flex', width: '100%', gap: 24, padding: 20 }}>
      <div style={{ flex: 1, maxWidth: 700 }}>
        <MemoryNameSection model={model} onNameChange={handleNameChange} />
        <TrackRoutingSection model={model} states={memory.trackRouting} onFieldChange={handleTrackRoutingChange} />
        <TracksSection model={model} onTracksChange={handleTracksChange} />
        <RecordSection model={model} state={memory.rec} onFieldChange={handleSectionChange('rec')} />
        <PlaybackSection model={model} state={memory.play} onFieldChange={handleSectionChange('play')} />
        <RhythmSection model={model} state={memory.rhythm} onFieldChange={handleSectionChange('rhythm')} />
      </div>

      <div style={{ width: 300, flexShrink: 0 }}>
        <MemorySummaryPanel memory={memory} />
      </div>
    </div>
  )
}
