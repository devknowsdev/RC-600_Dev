import { ToggleField } from '../../../components/fields/ToggleField'
import { FieldStatusBadge } from '../../../components/fields/FieldStatusBadge'
import { EnumField } from '../../../components/fields/EnumField'

type TrackField = {
  canonical_id: string
  ui_label: string
  mapping_status?: string
  values?: string[]
}

type Props = {
  trackIndex: number
  fields: TrackField[]
  reverse: boolean
  oneShot: boolean
  playMode: string
  startMode: string
  stopMode: string
  onToggleReverse: (v: boolean) => void
  onToggleOneShot: (v: boolean) => void
  onChangePlayMode: (v: string) => void
  onChangeStartMode: (v: string) => void
  onChangeStopMode: (v: string) => void
}

export function TrackCard({
  trackIndex,
  fields,
  reverse,
  oneShot,
  playMode,
  startMode,
  stopMode,
  onToggleReverse,
  onToggleOneShot,
  onChangePlayMode,
  onChangeStartMode,
  onChangeStopMode
}: Props) {
  const playbackFields = fields.filter((field) =>
    field.canonical_id === 'track.reverse' ||
    field.canonical_id === 'track.one_shot' ||
    field.canonical_id === 'track.play_mode'
  )

  const timingFields = fields.filter((field) =>
    field.canonical_id === 'track.start_mode' ||
    field.canonical_id === 'track.stop_mode'
  )

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 12 }}>
      <h4 style={{ marginTop: 0 }}>Track {trackIndex}</h4>

      <Section title="Playback">
        {playbackFields.map((field) =>
          renderField({
            field,
            reverse,
            oneShot,
            playMode,
            startMode,
            stopMode,
            onToggleReverse,
            onToggleOneShot,
            onChangePlayMode,
            onChangeStartMode,
            onChangeStopMode
          })
        )}
      </Section>

      <Section title="Timing">
        {timingFields.map((field) =>
          renderField({
            field,
            reverse,
            oneShot,
            playMode,
            startMode,
            stopMode,
            onToggleReverse,
            onToggleOneShot,
            onChangePlayMode,
            onChangeStartMode,
            onChangeStopMode
          })
        )}
      </Section>
    </div>
  )
}

function renderField({
  field,
  reverse,
  oneShot,
  playMode,
  startMode,
  stopMode,
  onToggleReverse,
  onToggleOneShot,
  onChangePlayMode,
  onChangeStartMode,
  onChangeStopMode
}: any) {
  if (field.canonical_id === 'track.play_mode') {
    return (
      <Row key={field.canonical_id}>
        <EnumField
          label={field.ui_label}
          value={playMode}
          options={field.values || ['MULTI', 'SINGLE']}
          onChange={onChangePlayMode}
        />
        <FieldStatusBadge status={normalizeStatus(field.mapping_status)} />
      </Row>
    )
  }

  if (field.canonical_id === 'track.start_mode') {
    return (
      <Row key={field.canonical_id}>
        <EnumField
          label={field.ui_label}
          value={startMode}
          options={field.values || ['IMMEDIATE', 'FADE']}
          onChange={onChangeStartMode}
        />
        <FieldStatusBadge status={normalizeStatus(field.mapping_status)} />
      </Row>
    )
  }

  if (field.canonical_id === 'track.stop_mode') {
    return (
      <Row key={field.canonical_id}>
        <EnumField
          label={field.ui_label}
          value={stopMode}
          options={field.values || ['IMMEDIATE', 'FADE', 'LOOP']}
          onChange={onChangeStopMode}
        />
        <FieldStatusBadge status={normalizeStatus(field.mapping_status)} />
      </Row>
    )
  }

  const checked = field.canonical_id === 'track.reverse' ? reverse : oneShot
  const onChange = field.canonical_id === 'track.reverse' ? onToggleReverse : onToggleOneShot

  return (
    <Row key={field.canonical_id}>
      <ToggleField label={field.ui_label} checked={checked} onChange={onChange} />
      <FieldStatusBadge status={normalizeStatus(field.mapping_status)} />
    </Row>
  )
}

function Section({ title, children }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#555' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

function Row({ children }: any) {
  return <div style={{ display: 'flex', justifyContent: 'space-between' }}>{children}</div>
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
