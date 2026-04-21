// Types for the parsed v1-memory-model.yaml schema.
// Keep in sync with docs/reference/v1-memory-model.yaml.

export type MappingStatus =
  | 'confirmed'
  | 'provisional'
  | 'unknown'
  | 'structurally_supported'
  | 'broad_scope_supported'

export type FieldType =
  | 'enum'
  | 'integer'
  | 'range'
  | 'string'
  | 'union'
  | 'object'
  | 'per_track_toggle'

export type FieldConstraints = {
  max_length?: number
  min?: number
  max?: number
}

export type MemoryField = {
  canonical_id: string
  ui_label: string
  type?: FieldType
  values?: string[]
  mapping_status?: MappingStatus
  constraints?: FieldConstraints
  xml_scope?: string
  xml_field?: string | null
  evidence?: string
  confidence?: string
  notes?: string[]
  children?: MemoryField[]
}

export type MemorySection = {
  id: string
  ui_label?: string
  official_section?: string
  xml_scope?: string
  mapping_status?: MappingStatus
  repeated?: boolean
  repeat_label?: string
  fields: MemoryField[]
}

export type MemoryModel = {
  model: string
  memory_sections: MemorySection[]
  ui_v1?: {
    editable_sections: string[]
    deferred_sections: string[]
  }
}

// Generic section state: canonical_id → value
export type SectionState = { [canonicalId: string]: unknown }

// Build initial state for a flat section from its field definitions.
// Defaults:
// - boolean enums → false
// - other enums → first value
// - integer/range → min if present, otherwise 0
// - string → ''
export function buildInitialSectionState(fields: MemoryField[]): SectionState {
  const state: SectionState = {}

  for (const field of fields) {
    if (!field.type) continue

    const isBoolEnum =
      field.type === 'enum' &&
      Array.isArray(field.values) &&
      field.values.length === 2 &&
      field.values.includes('OFF') &&
      field.values.includes('ON')

    if (isBoolEnum) {
      state[field.canonical_id] = false
    } else if (field.type === 'enum' && Array.isArray(field.values) && field.values.length > 0) {
      state[field.canonical_id] = field.values[0]
    } else if (field.type === 'integer' || field.type === 'range') {
      state[field.canonical_id] = field.constraints?.min ?? 0
    } else if (field.type === 'string') {
      state[field.canonical_id] = ''
    }
  }

  return state
}

export function findSection(
  model: MemoryModel,
  sectionId: string
): MemorySection | undefined {
  return model.memory_sections.find((s) => s.id === sectionId)
}
