// Types for the parsed v1-memory-model.yaml schema.
// Keep in sync with docs/reference/v1-memory-model.yaml.
// These types are intentionally permissive on optional fields
// to stay compatible with partial/provisional schema entries.

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

// Helper: find a section by id
export function findSection(
  model: MemoryModel,
  sectionId: string
): MemorySection | undefined {
  return model.memory_sections.find((s) => s.id === sectionId)
}

// Helper: find a field by canonical_id within a section
export function findField(
  section: MemorySection,
  canonicalId: string
): MemoryField | undefined {
  return section.fields.find((f) => f.canonical_id === canonicalId)
}
