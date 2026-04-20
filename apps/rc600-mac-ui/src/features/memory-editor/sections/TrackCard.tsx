import { ToggleField } from '../../../components/fields/ToggleField'

export function TrackCard({ trackIndex }: { trackIndex: number }) {
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 12 }}>
      <h4 style={{ marginTop: 0 }}>Track {trackIndex}</h4>

      <div style={{ display: 'flex', gap: 16 }}>
        <ToggleField label="Reverse" checked={false} onChange={() => {}} />
        <ToggleField label="One Shot" checked={false} onChange={() => {}} />
      </div>
    </div>
  )
}
