import type { TrackState } from '../memory-editor/sections/TrackCard'
import type { SectionState } from '../schema/memoryModelTypes'

export type CanonicalMemoryState = {
  name: string
  tracks: TrackState[]
  rec: SectionState
  play: SectionState
  rhythm: SectionState
}

export function buildInitialCanonicalState(): CanonicalMemoryState {
  return {
    name: '',
    tracks: [],
    rec: {},
    play: {},
    rhythm: {},
  }
}

function val(state: SectionState, id: string): unknown {
  return state[id]
}

function isOn(state: SectionState, id: string): boolean {
  const v = val(state, id)
  return v === true || v === 'ON'
}

function isValue(state: SectionState, id: string, value: string): boolean {
  return val(state, id) === value
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

  if (memory.name) {
    lines.push(`Memory: ${memory.name}`)
  }

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

  if (lines.length === 0 || (lines.length === 1 && memory.name)) {
    lines.push('No notable behaviors configured yet.')
  }

  return lines
}
