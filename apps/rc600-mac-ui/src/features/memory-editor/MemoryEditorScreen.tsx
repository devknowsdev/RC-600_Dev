import { useEffect, useState } from 'react'
import { loadMemoryModel } from '../schema/loadMemoryModel'
import { MemoryNameSection } from './sections/MemoryNameSection'
import { TracksSection } from './sections/TracksSection'
import { MemorySummaryPanel } from '../memory-summary/MemorySummaryPanel'
import type { MemoryModel } from '../schema/memoryModelTypes'
import type { TrackState } from './sections/TrackCard'

export function MemoryEditorScreen() {
  const [model, setModel] = useState<MemoryModel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tracks, setTracks] = useState<TrackState[]>([])

  useEffect(() => {
    loadMemoryModel()
      .then(setModel)
      .catch((err) => setError(String(err)))
  }, [])

  if (error) {
    return <div style={{ padding: 20, color: 'red' }}>Failed to load schema: {error}</div>
  }

  if (!model) {
    return <div style={{ padding: 20 }}>Loading...</div>
  }

  return (
    <div style={{ display: 'flex', width: '100%', gap: 24, padding: 20 }}>
      {/* Center: editor */}
      <div style={{ flex: 1, maxWidth: 700 }}>
        <MemoryNameSection model={model} />
        <TracksSection model={model} onTracksChange={setTracks} />
      </div>

      {/* Right: summary panel */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <MemorySummaryPanel tracks={tracks} />
      </div>
    </div>
  )
}
