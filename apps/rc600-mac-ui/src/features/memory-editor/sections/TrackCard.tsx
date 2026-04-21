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
  loopSync: boolean
  tempoSync: boolean
  onToggleReverse: (v: boolean) => void
  onToggleOneShot: (v: boolean) => void
  onChangePlayMode: (v: string) => void
  onChangeStartMode: (v: string) => void
  onChangeStopMode: (v: string) => void
  onToggleLoopSync: (v: boolean) => void
  onToggleTempoSync: (v: boolean) => void
}

export function TrackCard({
  trackIndex,
  fields,
  reverse,
  oneShot,
  playMode,
  startMode,
  stopMode,
  loopSync,
  tempoSync,
  onToggleReverse,
  onToggleOneShot,
  onChangePlayMode,
  onChangeStartMode,
  onChangeStopMode,
  onToggleLoopSync,
  onToggleTempoSync
}: Props) {
  const playbackFields = fields.filter((f) => ['track.reverse','track.one_shot','track.play_mode'].includes(f.canonical_id))
  const timingFields = fields.filter((f) => ['track.start_mode','track.stop_mode'].includes(f.canonical_id))
  const syncFields = fields.filter((f) => ['track.loop_sync_sw','track.tempo_sync_sw'].includes(f.canonical_id))

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 12 }}>
      <h4 style={{ marginTop: 0 }}>Track {trackIndex}</h4>

      <Section title="Playback">
        {playbackFields.map((field: TrackField) => renderField(field, { reverse, oneShot, playMode, startMode, stopMode, loopSync, tempoSync }, { onToggleReverse, onToggleOneShot, onChangePlayMode, onChangeStartMode, onChangeStopMode, onToggleLoopSync, onToggleTempoSync }))}
      </Section>

      <Section title="Timing">
        {timingFields.map((field: TrackField) => renderField(field, { reverse, oneShot, playMode, startMode, stopMode, loopSync, tempoSync }, { onToggleReverse, onToggleOneShot, onChangePlayMode, onChangeStartMode, onChangeStopMode, onToggleLoopSync, onToggleTempoSync }))}
      </Section>

      <Section title="Sync">
        {syncFields.map((field: TrackField) => renderField(field, { reverse, oneShot, playMode, startMode, stopMode, loopSync, tempoSync }, { onToggleReverse, onToggleOneShot, onChangePlayMode, onChangeStartMode, onChangeStopMode, onToggleLoopSync, onToggleTempoSync }))}
      </Section>
    </div>
  )
}

function renderField(field: TrackField, state: any, actions: any) {
  if (field.canonical_id === 'track.play_mode') {
    return (
      <Row key={field.canonical_id}>
        <EnumField label={field.ui_label} value={state.playMode} options={field.values || ['MULTI','SINGLE']} onChange={actions.onChangePlayMode} />
        <FieldStatusBadge status={normalizeStatus(field.mapping_status)} />
      </Row>
    )
  }

  if (field.canonical_id === 'track.start_mode') {
    return (
      <Row key={field.canonical_id}>
        <EnumField label={field.ui_label} value={state.startMode} options={field.values || ['IMMEDIATE','FADE']} onChange={actions.onChangeStartMode} />
        <FieldStatusBadge status={normalizeStatus(field.mapping_status)} />
      </Row>
    )
  }

  if (field.canonical_id === 'track.stop_mode') {
    return (
      <Row key={field.canonical_id}>
        <EnumField label={field.ui_label} value={state.stopMode} options={field.values || ['IMMEDIATE','FADE','LOOP']} onChange={actions.onChangeStopMode} />
        <FieldStatusBadge status={normalizeStatus(field.mapping_status)} />
      </Row>
    )
  }

  if (field.canonical_id === 'track.loop_sync_sw') {
    return (
      <Row key={field.canonical_id}>
        <ToggleField label={field.ui_label} checked={state.loopSync} onChange={actions.onToggleLoopSync} />
        <FieldStatusBadge status={normalizeStatus(field.mapping_status)} />
      </Row>
    )
  }

  if (field.canonical_id === 'track.tempo_sync_sw') {
    return (
      <Row key={field.canonical_id}>
        <ToggleField label={field.ui_label} checked={state.tempoSync} onChange={actions.onToggleTempoSync} />
        <FieldStatusBadge status={normalizeStatus(field.mapping_status)} />
      </Row>
    )
  }

  const checked = field.canonical_id === 'track.reverse' ? state.reverse : state.oneShot
  const onChange = field.canonical_id === 'track.reverse' ? actions.onToggleReverse : actions.onToggleOneShot

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
  if (status === 'confirmed' || status === 'provisional' || status === 'unknown') return status
  if (status === 'structurally_supported' || status === 'broad_scope_supported') return 'confirmed'
  return 'unknown'
}
