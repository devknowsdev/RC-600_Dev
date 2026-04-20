export type TrackState = {
  reverse: boolean
  oneShot: boolean
}

export type MemoryEditorState = {
  name: string
  tracks: TrackState[]
}

export function createInitialMemoryEditorState(): MemoryEditorState {
  return {
    name: '',
    tracks: Array.from({ length: 6 }, () => ({
      reverse: false,
      oneShot: false
    }))
  }
}
