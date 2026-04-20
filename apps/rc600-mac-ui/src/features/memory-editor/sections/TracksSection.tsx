import { TrackCard } from './TrackCard'
import { useState, useMemo } from 'react'

export function TracksSection({ model }: any) {
  const trackFields = useMemo(() => {
    const section = model?.memory_sections?.find((s: any) => s.id === 'tracks')
    if (!section) return []

    return section.fields.filter((f: any) =>
      f.canonical_id === 'track.reverse' || f.canonical_id === 'track.one_shot'
    )
  }, [model])

  const [tracks, setTracks] = useState(
    Array.from({ length: 6 }, () => ({ reverse: false, oneShot: false }))
  )

  function updateTrack(index: number, updates: any) {
    const next = [...tracks]
    next[index] = { ...next[index], ...updates }
    setTracks(next)
  }

  return (
    <section style={{ marginTop: 20 }}>
      <h2>Tracks</h2>

      {tracks.map((t, i) => (
        <TrackCard
          key={i}
          trackIndex={i + 1}
          fields={trackFields}
          reverse={t.reverse}
          oneShot={t.oneShot}
          onToggleReverse={(v) => updateTrack(i, { reverse: v })}
          onToggleOneShot={(v) => updateTrack(i, { oneShot: v })}
        />
      ))}
    </section>
  )
}
