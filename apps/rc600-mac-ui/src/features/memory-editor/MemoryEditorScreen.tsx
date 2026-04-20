import { useEffect, useState } from 'react'
import { loadMemoryModel } from '../schema/loadMemoryModel'
import { MemoryNameSection } from './sections/MemoryNameSection'

export function MemoryEditorScreen() {
  const [model, setModel] = useState<any>(null)

  useEffect(() => {
    loadMemoryModel().then(setModel)
  }, [])

  if (!model) {
    return <div style={{ padding: 20 }}>Loading...</div>
  }

  return (
    <div style={{ padding: 20, width: '100%' }}>
      <MemoryNameSection model={model} />
    </div>
  )
}
