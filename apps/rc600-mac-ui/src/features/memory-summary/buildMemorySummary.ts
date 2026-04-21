type TrackState = {
  reverse: boolean
  oneShot: boolean
  playMode: string
  startMode: string
  stopMode: string
  loopSync: boolean
  tempoSync: boolean
}

export function buildMemorySummary(tracks: TrackState[]): string[] {
  const lines: string[] = []

  const reverseTracks = tracks
    .map((track, index) => ({ track, index: index + 1 }))
    .filter(({ track }) => track.reverse)
    .map(({ index }) => index)

  const oneShotTracks = tracks
    .map((track, index) => ({ track, index: index + 1 }))
    .filter(({ track }) => track.oneShot)
    .map(({ index }) => index)

  const singleModeTracks = tracks
    .map((track, index) => ({ track, index: index + 1 }))
    .filter(({ track }) => track.playMode === 'SINGLE')
    .map(({ index }) => index)

  const loopSyncTracks = tracks
    .map((track, index) => ({ track, index: index + 1 }))
    .filter(({ track }) => track.loopSync)
    .map(({ index }) => index)

  const tempoSyncTracks = tracks
    .map((track, index) => ({ track, index: index + 1 }))
    .filter(({ track }) => track.tempoSync)
    .map(({ index }) => index)

  if (reverseTracks.length > 0) {
    lines.push(`Reverse enabled on tracks ${reverseTracks.join(', ')}`)
  }

  if (oneShotTracks.length > 0) {
    lines.push(`One Shot enabled on tracks ${oneShotTracks.join(', ')}`)
  }

  if (singleModeTracks.length > 0) {
    lines.push(`Single play mode on tracks ${singleModeTracks.join(', ')}`)
  }

  if (loopSyncTracks.length > 0) {
    lines.push(`Loop Sync enabled on tracks ${loopSyncTracks.join(', ')}`)
  }

  if (tempoSyncTracks.length > 0) {
    lines.push(`Tempo Sync enabled on tracks ${tempoSyncTracks.join(', ')}`)
  }

  if (lines.length === 0) {
    lines.push('No notable track behaviors configured yet.')
  }

  return lines
}
