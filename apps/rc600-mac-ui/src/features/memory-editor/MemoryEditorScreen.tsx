import { useEffect, useState } from 'react'
import { loadMemoryModel } from '../schema/loadMemoryModel'
import { MemoryNameSection } from './sections/MemoryNameSection'
import { TracksSection } from './sections/TracksSection'
import { MemorySummaryPanel } from '../memory-summary/MemorySummaryPanel'
import { buildInitialCanonicalState } from '../memory-summary/buildMemorySummary'
import type { MemoryModel } from '../schema/memoryModelTypes'
import type { TrackState } from './sections/TrackCard'
import type { CanonicalMemoryState } from '../memory-summary/buildMemorySummary'

export function MemoryEditorScreen() {
  const [model, setModel] = useState<MemoryModel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [memory, setMemory] = useState<CanonicalMemoryState>(buildInitialCanonicalState)

  useEffect(() => {
    loadMemoryModel()
      .then(setModel)
      .catch((err) => setError(String(err)))
  }, [])

  function handleNameChange(name: string) {
    setMemory((prev) => ({ ...prev, name }))
  }

  function handleTracksChange(tracks: TrackState[]) {
    setMemory((prev) => ({ ...prev, tracks }))
  }

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
        <MemoryNameSection
          model={model}
          onNameChange={handleNameChange}
        />
        <TracksSection
          model={model}
          onTracksChange={handleTracksChange}
        />
      </div>

      {/* Right: summary panel */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <MemorySummaryPanel memory={memory} />
      </div>
    </div>
  )
}
