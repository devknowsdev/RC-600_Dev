import type { TrackState } from '../memory-editor/sections/TrackCard'

// Reads track state using canonical_id keys (e.g. 'track.reverse')
// to match the schema-driven TrackState shape: { [canonicalId: string]: unknown }
function get(track: TrackState, canonicalId: string): unknown {
  return track[canonicalId]
}

function isOn(track: TrackState, canonicalId: string): boolean {
  const v = get(track, canonicalId)
  return v === true || v === 'ON'
}

function isValue(track: TrackState, canonicalId: string, value: string): boolean {
  return get(track, canonicalId) === value
}

function tracksWhere(
  tracks: TrackState[],
  predicate: (t: TrackState) => boolean
): number[] {
  return tracks
    .map((t, i) => ({ t, n: i + 1 }))
    .filter(({ t }) => predicate(t))
    .map(({ n }) => n)
}

export function buildMemorySummary(tracks: TrackState[]): string[] {
  if (!tracks || tracks.length === 0) {
    return ['No track data yet.']
  }

  const lines: string[] = []

  const reverse = tracksWhere(tracks, (t) => isOn(t, 'track.reverse'))
  const oneShot = tracksWhere(tracks, (t) => isOn(t, 'track.one_shot'))
  const single = tracksWhere(tracks, (t) => isValue(t, 'track.play_mode', 'SINGLE'))
  const loopSync = tracksWhere(tracks, (t) => isOn(t, 'track.loop_sync_sw'))
  const tempoSync = tracksWhere(tracks, (t) => isOn(t, 'track.tempo_sync_sw'))
  const bounceIn = tracksWhere(tracks, (t) => isOn(t, 'track.bounce_in'))

  if (reverse.length > 0) lines.push(`Reverse on tracks ${reverse.join(', ')}`)
  if (oneShot.length > 0) lines.push(`One Shot on tracks ${oneShot.join(', ')}`)
  if (single.length > 0) lines.push(`Single play mode on tracks ${single.join(', ')}`)
  if (loopSync.length > 0) lines.push(`Loop Sync on tracks ${loopSync.join(', ')}`)
  if (tempoSync.length > 0) lines.push(`Tempo Sync on tracks ${tempoSync.join(', ')}`)
  if (bounceIn.length > 0) lines.push(`Bounce In on tracks ${bounceIn.join(', ')}`)

  if (lines.length === 0) {
    lines.push('No notable track behaviors configured yet.')
  }

  return lines
}
