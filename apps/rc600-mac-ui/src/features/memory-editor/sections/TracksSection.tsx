import { TrackCard } from './TrackCard'

export function TracksSection() {
  return (
    <section style={{ marginTop: 20 }}>
      <h2>Tracks</h2>

      {[1, 2, 3, 4, 5, 6].map((i) => (
        <TrackCard key={i} trackIndex={i} />
      ))}
    </section>
  )
}
