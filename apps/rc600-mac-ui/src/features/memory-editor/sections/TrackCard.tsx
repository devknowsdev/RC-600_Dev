import { ToggleField } from '../../../components/fields/ToggleField'

type Props = {
  trackIndex: number
  reverse: boolean
  oneShot: boolean
  onToggleReverse: (v: boolean) => void
  onToggleOneShot: (v: boolean) => void
}

export function TrackCard({
  trackIndex,
  reverse,
  oneShot,
  onToggleReverse,
  onToggleOneShot
}: Props) {
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 12 }}>
      <h4 style={{ marginTop: 0 }}>Track {trackIndex}</h4>

      <div style={{ display: 'flex', gap: 16 }}>
        <ToggleField
          label="Reverse"
          checked={reverse}
          onChange={onToggleReverse}
        />

        <ToggleField
          label="One Shot"
          checked={oneShot}
          onChange={onToggleOneShot}
        />
      </div>
    </div>
  )
}
