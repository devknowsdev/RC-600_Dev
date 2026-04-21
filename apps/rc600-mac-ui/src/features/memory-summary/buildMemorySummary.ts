import type { TrackState } from '../memory-editor/sections/TrackCard'
import type { SectionState } from '../schema/memoryModelTypes'

// CanonicalMemoryState: full in-memory representation of one RC-600 memory.
// Add a key here when a new section is implemented in the UI.
export type CanonicalMemoryState = {
  name: string
  tracks: TrackState[]
  rec: SectionState
  play: SectionState
  rhythm: SectionState
}

export function buildInitialCanonicalState(): CanonicalMemoryState {
  return { name: '', tracks: [], rec: {}, play: {}, rhythm: {} }
}

// Reads a value from a section state by canonical_id key.
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

// Track-specific helpers
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
  const { tracks, rec, play, rhythm } = memory

  // Name
  if (memory.name) lines.push(`Memory: ${memory.name}`)

  // Tracks
  if (tracks && tracks.length > 0) {
    const reverse   = tracksWhere(tracks, (t) => isOn(t as SectionState, 'track.reverse'))
    const oneShot   = tracksWhere(tracks, (t) => isOn(t as SectionState, 'track.one_shot'))
    const single    = tracksWhere(tracks, (t) => isValue(t as SectionState, 'track.play_mode', 'SINGLE'))
    const loopSync  = tracksWhere(tracks, (t) => isOn(t as SectionState, 'track.loop_sync_sw'))
    const tempoSync = tracksWhere(tracks, (t) => isOn(t as SectionState, 'track.tempo_sync_sw'))
    const bounceIn  = tracksWhere(tracks, (t) => isOn(t as SectionState, 'track.bounce_in'))

    if (reverse.length > 0)   lines.push(`Reverse on tracks ${reverse.join(', ')}`)
    if (oneShot.length > 0)   lines.push(`One Shot on tracks ${oneShot.join(', ')}`)
    if (single.length > 0)    lines.push(`Single play mode on tracks ${single.join(', ')}`)
    if (loopSync.length > 0)  lines.push(`Loop Sync on tracks ${loopSync.join(', ')}`)
    if (tempoSync.length > 0) lines.push(`Tempo Sync on tracks ${tempoSync.join(', ')}`)
    if (bounceIn.length > 0)  lines.push(`Bounce In on tracks ${bounceIn.join(', ')}`)
  }

  // Record
  if (rec && Object.keys(rec).length > 0) {
    if (isOn(rec, 'rec.auto_rec_sw')) lines.push('Auto Record enabled')
    if (isOn(rec, 'rec.bounce_sw'))   lines.push('Bounce recording enabled')
    const action = val(rec, 'rec.action')
    if (action === 'REC->PLAY') lines.push('Record action: rec then play')
  }

  // Playback
  if (play && Object.keys(play).length > 0) {
    if (isValue(play, 'play.single_track_change', 'LOOP_END'))
      lines.push('Single track change: at loop end')
    if (isValue(play, 'play.speed_change', 'LOOP_END'))
      lines.push('Speed change: at loop end')
  }

  // Rhythm
  if (rhythm && Object.keys(rhythm).length > 0) {
    const genre = val(rhythm, 'rhythm.genre')
    if (genre && genre !== 'ACOUSTIC') lines.push(`Rhythm genre: ${genre}`)
    const startTrig = val(rhythm, 'rhythm.start_trig')
    if (startTrig && startTrig !== 'LOOP_START') lines.push(`Rhythm starts: ${startTrig}`)
    const stopTrig = val(rhythm, 'rhythm.stop_trig')
    if (stopTrig && stopTrig !== 'OFF') lines.push(`Rhythm stops: ${stopTrig}`)
  }

  if (lines.length === 0 || (lines.length === 1 && memory.name)) {
    lines.push('No notable behaviors configured yet.')
  }

  return lines
}
