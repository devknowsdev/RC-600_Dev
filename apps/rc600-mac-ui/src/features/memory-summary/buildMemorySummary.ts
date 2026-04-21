import type { TrackState } from '../memory-editor/sections/TrackCard'

// CanonicalMemoryState is the full in-memory representation of one RC-600 memory.
// Sections are added here as they are implemented in the UI.
// buildMemorySummary reads from this type — not from individual section states.
export type CanonicalMemoryState = {
  name: string
  tracks: TrackState[]
  // rec: RecState       — add when RecordSection is implemented
  // play: PlayState     — add when PlaybackSection is implemented
  // rhythm: RhythmState — add when RhythmSection is implemented
}

export function buildInitialCanonicalState(): CanonicalMemoryState {
  return {
    name: '',
    tracks: [],
  }
}

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

export function buildMemorySummary(memory: CanonicalMemoryState): string[] {
  const lines: string[] = []
  const { tracks } = memory

  if (!tracks || tracks.length === 0) {
    return ['No track data yet.']
  }

  // Name
  if (memory.name) {
    lines.push(`Memory: ${memory.name}`)
  }

  // Track behaviors
  const reverse   = tracksWhere(tracks, (t) => isOn(t, 'track.reverse'))
  const oneShot   = tracksWhere(tracks, (t) => isOn(t, 'track.one_shot'))
  const single    = tracksWhere(tracks, (t) => isValue(t, 'track.play_mode', 'SINGLE'))
  const loopSync  = tracksWhere(tracks, (t) => isOn(t, 'track.loop_sync_sw'))
  const tempoSync = tracksWhere(tracks, (t) => isOn(t, 'track.tempo_sync_sw'))
  const bounceIn  = tracksWhere(tracks, (t) => isOn(t, 'track.bounce_in'))

  if (reverse.length > 0)   lines.push(`Reverse on tracks ${reverse.join(', ')}`)
  if (oneShot.length > 0)   lines.push(`One Shot on tracks ${oneShot.join(', ')}`)
  if (single.length > 0)    lines.push(`Single play mode on tracks ${single.join(', ')}`)
  if (loopSync.length > 0)  lines.push(`Loop Sync on tracks ${loopSync.join(', ')}`)
  if (tempoSync.length > 0) lines.push(`Tempo Sync on tracks ${tempoSync.join(', ')}`)
  if (bounceIn.length > 0)  lines.push(`Bounce In on tracks ${bounceIn.join(', ')}`)

  // Placeholder hooks for future sections:
  // if (memory.rec) { ... }
  // if (memory.play) { ... }
  // if (memory.rhythm) { ... }

  if (lines.length === 0 || (lines.length === 1 && memory.name)) {
    lines.push('No notable behaviors configured yet.')
  }

  return lines
}
