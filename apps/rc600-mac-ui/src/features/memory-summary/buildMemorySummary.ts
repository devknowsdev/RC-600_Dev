import type { TrackState } from '../memory-editor/sections/TrackCard'
import type { SectionState } from '../schema/memoryModelTypes'

// CanonicalMemoryState: full in-memory representation of one RC-600 memory.
// Add keys here as new sections are implemented.
export type CanonicalMemoryState = {
  name: string
  tracks: TrackState[]
  rec: SectionState
  play: SectionState
  rhythm: SectionState
  trackRouting: SectionState[]  // 6 entries, one per track
}

export function buildInitialCanonicalState(): CanonicalMemoryState {
  return {
    name: '',
    tracks: [],
    rec: {},
    play: {},
    rhythm: {},
    trackRouting: Array.from({ length: 6 }, () => ({
      'routing.track.main': true,
      'routing.track.sub1': true,
      'routing.track.sub2': true,
      'routing.track.phones': true,
    })),
  }
}

// Helpers
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
  states: SectionState[],
  predicate: (t: SectionState) => boolean
): number[] {
  return states
    .map((t, i) => ({ t, n: i + 1 }))
    .filter(({ t }) => predicate(t))
    .map(({ n }) => n)
}

function formatTrackList(label: string, trackNums: number[]): string {
  if (trackNums.length === 6) return `${label}: all tracks`
  return `${label}: tracks ${trackNums.join(', ')}`
}

export function buildMemorySummary(memory: CanonicalMemoryState): string[] {
  const lines: string[] = []
  const { tracks, rec, play, rhythm, trackRouting } = memory

  // Name
  if (memory.name) lines.push(`Memory: ${memory.name}`)

  // === ROUTING (first, because it frames the memory's purpose) ===
  if (trackRouting && trackRouting.length === 6) {
    const mainTracks   = tracksWhere(trackRouting, (r) => isOn(r, 'routing.track.main'))
    const sub1Tracks   = tracksWhere(trackRouting, (r) => isOn(r, 'routing.track.sub1'))
    const sub2Tracks   = tracksWhere(trackRouting, (r) => isOn(r, 'routing.track.sub2'))
    const phonesTracks = tracksWhere(trackRouting, (r) => isOn(r, 'routing.track.phones'))

    // Only surface routing when it's not "all tracks to everything" (the factory default)
    const allDefault =
      mainTracks.length === 6 &&
      sub1Tracks.length === 6 &&
      sub2Tracks.length === 6 &&
      phonesTracks.length === 6

    if (!allDefault) {
      if (mainTracks.length > 0 && mainTracks.length < 6)
        lines.push(formatTrackList('MAIN output', mainTracks))
      if (mainTracks.length === 0)
        lines.push('MAIN output: no tracks')

      if (sub1Tracks.length > 0 && sub1Tracks.length < 6)
        lines.push(formatTrackList('SUB 1 output', sub1Tracks))
      if (sub1Tracks.length === 0)
        lines.push('SUB 1 output: no tracks')

      if (sub2Tracks.length > 0 && sub2Tracks.length < 6)
        lines.push(formatTrackList('SUB 2 output', sub2Tracks))

      if (phonesTracks.length > 0 && phonesTracks.length < 6)
        lines.push(formatTrackList('PHONES output', phonesTracks))
    }
  }

  // === TRACKS ===
  if (tracks && tracks.length > 0) {
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
  }

  // === RECORD ===
  if (rec && Object.keys(rec).length > 0) {
    if (isOn(rec, 'rec.auto_rec_sw'))              lines.push('Auto Record enabled')
    if (isOn(rec, 'rec.bounce_sw'))                lines.push('Bounce recording enabled')
    if (isValue(rec, 'rec.quantize', 'MEASURE'))   lines.push('Recording quantized to measure')
    if (isValue(rec, 'rec.action', 'REC->PLAY'))   lines.push('Record action: rec then play')
  }

  // === PLAYBACK ===
  if (play && Object.keys(play).length > 0) {
    if (isValue(play, 'play.single_track_change', 'LOOP_END'))
      lines.push('Single track change: at loop end')
    if (isValue(play, 'play.speed_change', 'LOOP_END'))
      lines.push('Speed change: at loop end')
    if (isValue(play, 'play.sync_adjust', 'BEAT'))
      lines.push('Sync adjust: beat')
  }

  // === RHYTHM ===
  if (rhythm && Object.keys(rhythm).length > 0) {
    const startTrig = val(rhythm, 'rhythm.start_trig')
    const stopTrig  = val(rhythm, 'rhythm.stop_trig')
    if (startTrig && startTrig !== 'LOOP_START') lines.push(`Rhythm starts: ${startTrig}`)
    if (stopTrig  && stopTrig  !== 'OFF')        lines.push(`Rhythm stops: ${stopTrig}`)
  }

  // Fallback
  if (lines.length === 0 || (lines.length === 1 && memory.name)) {
    lines.push('No notable behaviors configured yet.')
  }

  return lines
}
