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

  const maxLength = field?.constraints?.max_length ?? 12
  const status = normalizeStatus(field.mapping_status)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Memory Name</h2>
        <FieldStatusBadge status={status} />
      </div>

      <TextField
        label={field.ui_label}
        value={value}
        onChange={(next) => setValue(next.slice(0, maxLength))}
      />

      <div style={{ fontSize: 12, color: '#666' }}>
        {value.length}/{maxLength} characters
      </div>
    </div>
  )
}

function normalizeStatus(status: string): 'confirmed' | 'provisional' | 'unknown' {
  if (status === 'confirmed' || status === 'provisional' || status === 'unknown') {
    return status
  }
  if (status === 'structurally_supported' || status === 'broad_scope_supported') {
    return 'confirmed'
  }
  return 'unknown'
}
