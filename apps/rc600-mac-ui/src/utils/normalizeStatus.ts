import type { MappingStatus } from '../features/schema/memoryModelTypes'

// Normalize the raw mapping_status values from the YAML schema
// into the three display states used by FieldStatusBadge.
export function normalizeStatus(
  status?: MappingStatus | string
): 'confirmed' | 'provisional' | 'unknown' {
  if (status === 'confirmed' || status === 'provisional' || status === 'unknown') {
    return status
  }
  if (status === 'structurally_supported' || status === 'broad_scope_supported') {
    return 'confirmed'
  }
  return 'unknown'
}
