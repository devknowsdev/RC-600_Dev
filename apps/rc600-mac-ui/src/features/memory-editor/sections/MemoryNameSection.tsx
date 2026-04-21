import { useMemo, useState } from 'react'
import { TextField } from '../../../components/fields/TextField'
import { FieldStatusBadge } from '../../../components/fields/FieldStatusBadge'
import { normalizeStatus } from '../../../utils/normalizeStatus'
import type { MemoryModel } from '../../../features/schema/memoryModelTypes'

type Props = {
  model: MemoryModel
  onNameChange?: (name: string) => void
}

export function MemoryNameSection({ model, onNameChange }: Props) {
  const field = useMemo(() => {
    const section = model.memory_sections.find((s) => s.id === 'name')
    return section?.fields?.[0]
  }, [model])

  const [value, setValue] = useState('')

  if (!field) return <div>Missing name field in schema</div>

  const maxLength = field.constraints?.max_length ?? 12
  const status = normalizeStatus(field.mapping_status)

  function handleChange(next: string) {
    const trimmed = next.slice(0, maxLength)
    setValue(trimmed)
    onNameChange?.(trimmed)
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Memory Name</h2>
        <FieldStatusBadge status={status} />
      </div>

      <div style={{ marginTop: 8 }}>
        <TextField
          label={field.ui_label}
          value={value}
          onChange={handleChange}
        />
      </div>

      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
        {value.length}/{maxLength} characters
      </div>
    </div>
  )
}
