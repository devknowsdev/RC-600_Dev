import { TrackCard } from './TrackCard'
import { useState, useMemo } from 'react'

export function TracksSection({ model }: any) {
  const trackFields = useMemo(() => {
    const section = model?.memory_sections?.find((s: any) => s.id === 'tracks')
    if (!section) return []

    return section.fields
  }, [model])

  const [tracks, setTracks] = useState(
    Array.from({ length: 6 }, () => ({
      reverse: false,
      oneShot: false,
      playMode: 'MULTI',
      startMode: 'IMMEDIATE',
      stopMode: 'IMMEDIATE',
      loopSync: false,
      tempoSync: false
    }))
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
          playMode={t.playMode}
          startMode={t.startMode}
          stopMode={t.stopMode}
          loopSync={t.loopSync}
          tempoSync={t.tempoSync}
          onToggleReverse={(v) => updateTrack(i, { reverse: v })}
          onToggleOneShot={(v) => updateTrack(i, { oneShot: v })}
          onChangePlayMode={(v) => updateTrack(i, { playMode: v })}
          onChangeStartMode={(v) => updateTrack(i, { startMode: v })}
          onChangeStopMode={(v) => updateTrack(i, { stopMode: v })}
          onToggleLoopSync={(v) => updateTrack(i, { loopSync: v })}
          onToggleTempoSync={(v) => updateTrack(i, { tempoSync: v })}
        />
      ))}
    </section>
  )
}
