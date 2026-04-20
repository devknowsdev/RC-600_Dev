import { useMemo, useState } from 'react'
import { TextField } from '../../../components/fields/TextField'
import { FieldStatusBadge } from '../../../components/fields/FieldStatusBadge'

export function MemoryNameSection({ model }: any) {
  const field = useMemo(() => {
    const section = model.memory_sections.find((s: any) => s.id === 'name')
    return section?.fields?.[0]
  }, [model])

  const [value, setValue] = useState('')

  if (!field) return <div>Missing field</div>

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Memory Name</h2>
        <FieldStatusBadge status="confirmed" />
      </div>

      <TextField
        label={field.ui_label}
        value={value}
        onChange={setValue}
      />

      <div style={{ fontSize: 12, color: '#666' }}>
        {value.length}/12 characters
      </div>
    </div>
  )
}
