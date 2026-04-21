// Generic schema-driven field renderer.
// Reads field.type from the schema and dispatches to the correct component.
// Contains NO RC-600-specific logic. No canonical_id switches.
// To add a new field: add it to the YAML schema. No code change needed here.

import type { MemoryField } from '../../features/schema/memoryModelTypes'
import { normalizeStatus } from '../../utils/normalizeStatus'
import { ToggleField } from './ToggleField'
import { EnumField } from './EnumField'
import { TextField } from './TextField'
import { FieldStatusBadge } from './FieldStatusBadge'

type Props = {
  field: MemoryField
  value: unknown
  onChange: (next: unknown) => void
}

export function FieldRenderer({ field, value, onChange }: Props) {
  const badge = <FieldStatusBadge status={normalizeStatus(field.mapping_status)} />

  // Boolean toggle: enum with exactly [OFF, ON] values
  const isBooleanEnum =
    field.type === 'enum' &&
    Array.isArray(field.values) &&
    field.values.length === 2 &&
    field.values.includes('OFF') &&
    field.values.includes('ON')

  if (isBooleanEnum) {
    return (
      <Row>
        <ToggleField
          label={field.ui_label}
          checked={value === true || value === 'ON'}
          onChange={(next) => onChange(next)}
        />
        {badge}
      </Row>
    )
  }

  // Multi-value enum: render as select
  if (field.type === 'enum' && Array.isArray(field.values) && field.values.length > 0) {
    return (
      <Row>
        <EnumField
          label={field.ui_label}
          value={typeof value === 'string' ? value : (field.values[0] ?? '')}
          options={field.values}
          onChange={(next) => onChange(next)}
        />
        {badge}
      </Row>
    )
  }

  // String fields
  if (field.type === 'string') {
    return (
      <Row>
        <TextField
          label={field.ui_label}
          value={typeof value === 'string' ? value : ''}
          onChange={(next) => onChange(next)}
        />
        {badge}
      </Row>
    )
  }

  // Integer / range fields — plain number input for now
  // TODO: replace with NumericField (slider + input) when available
  if (field.type === 'integer' || field.type === 'range') {
    return (
      <Row>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{field.ui_label}</span>
          <input
            type="number"
            value={typeof value === 'number' ? value : 0}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ width: 64, padding: 4 }}
          />
        </label>
        {badge}
      </Row>
    )
  }

  // Fallback: unknown or unhandled type — render label + badge only
  return (
    <Row>
      <span style={{ color: '#999', fontSize: 13 }}>
        {field.ui_label}
        {field.type ? ` (${field.type} — not yet rendered)` : ''}
      </span>
      {badge}
    </Row>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {children}
    </div>
  )
}
