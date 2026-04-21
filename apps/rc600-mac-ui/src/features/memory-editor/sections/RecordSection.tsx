import { useMemo } from 'react'
import { FieldRenderer } from '../../../components/fields/FieldRenderer'
import type { MemoryModel, SectionState } from '../../../features/schema/memoryModelTypes'

type Props = {
  model: MemoryModel
  state: SectionState
  onFieldChange: (canonicalId: string, value: unknown) => void
}

export function RecordSection({ model, state, onFieldChange }: Props) {
  const fields = useMemo(
    () => model.memory_sections.find((s) => s.id === 'rec')?.fields ?? [],
    [model]
  )
  if (fields.length === 0) return null
  return (
    <section style={{ marginTop: 20 }}>
      <h2>Record</h2>
      <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fields.map((field) => (
          <FieldRenderer
            key={field.canonical_id}
            field={field}
            value={state[field.canonical_id]}
            onChange={(v) => onFieldChange(field.canonical_id, v)}
          />
        ))}
      </div>
    </section>
  )
}
