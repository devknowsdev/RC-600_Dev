import { ToggleField } from '../../../components/fields/ToggleField'
import { FieldStatusBadge } from '../../../components/fields/FieldStatusBadge'

type TrackField = {
  canonical_id: string
  ui_label: string
  mapping_status?: string
}

type Props = {
  trackIndex: number
  fields: TrackField[]
  reverse: boolean
  oneShot: boolean
  onToggleReverse: (v: boolean) => void
  onToggleOneShot: (v: boolean) => void
}

export function TrackCard({
  trackIndex,
  fields,
  reverse,
  oneShot,
  onToggleReverse,
  onToggleOneShot
}: Props) {
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 12 }}>
      <h4 style={{ marginTop: 0 }}>Track {trackIndex}</h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fields.map((field) => {
          const checked = field.canonical_id === 'track.reverse' ? reverse : oneShot
          const onChange = field.canonical_id === 'track.reverse' ? onToggleReverse : onToggleOneShot

          return (
            <div
              key={field.canonical_id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <ToggleField
                label={field.ui_label}
                checked={checked}
                onChange={onChange}
              />
              <FieldStatusBadge status={normalizeStatus(field.mapping_status)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function normalizeStatus(status?: string): 'confirmed' | 'provisional' | 'unknown' {
  if (status === 'confirmed' || status === 'provisional' || status === 'unknown') {
    return status
  }
  if (status === 'structurally_supported' || status === 'broad_scope_supported') {
    return 'confirmed'
  }
  return 'unknown'
}
