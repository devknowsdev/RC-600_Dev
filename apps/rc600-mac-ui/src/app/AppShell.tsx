import { MemoryEditorScreen } from '../features/memory-editor/MemoryEditorScreen'

export function AppShell() {
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <MemoryEditorScreen />
    </div>
  )
}
