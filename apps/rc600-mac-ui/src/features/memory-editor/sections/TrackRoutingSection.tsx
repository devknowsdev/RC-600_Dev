// TrackRoutingSection: a compact matrix showing per-track output bus assignment.
// Rows = tracks 1-6, Columns = MAIN / SUB1 / SUB2 / PHONES.
// This is intentionally NOT using FieldRenderer — routing is better shown as a
// matrix than as individual field rows. This is the one section where a custom
// layout is warranted by the domain structure.

import { useMemo } from 'react'
import type { MemoryModel, SectionState, MemoryField } from '../../../features/schema/memoryModelTypes'
import { normalizeStatus } from '../../../utils/normalizeStatus'
import { FieldStatusBadge } from '../../../components/fields/FieldStatusBadge'

type Props = {
  model: MemoryModel
  states: SectionState[]  // 6 entries, one per track
  onFieldChange: (trackIndex: number, canonicalId: string, value: unknown) => void
}

const BUS_FIELDS = [
  'routing.track.main',
  'routing.track.sub1',
  'routing.track.sub2',
  'routing.track.phones',
]

const BUS_LABELS: Record<string, string> = {
  'routing.track.main': 'MAIN',
  'routing.track.sub1': 'SUB 1',
  'routing.track.sub2': 'SUB 2',
  'routing.track.phones': 'PHONES',
}

export function TrackRoutingSection({ model, states, onFieldChange }: Props) {
  const fields = useMemo(() => {
    const section = model.memory_sections.find((s) => s.id === 'routing_track')
    return section?.fields ?? []
  }, [model])

  const fieldMap = useMemo(() => {
    const map: Record<string, MemoryField> = {}
    for (const f of fields) map[f.canonical_id] = f
    return map
  }, [fields])

  if (fields.length === 0) return null

  // Worst-case mapping status across all routing fields
  const worstStatus = fields.reduce(
    (worst, f) => {
      const s = normalizeStatus(f.mapping_status)
      if (s === 'unknown') return 'unknown'
      if (s === 'provisional' && worst !== 'unknown') return 'provisional'
      return worst
    },
    'confirmed' as 'confirmed' | 'provisional' | 'unknown'
  )

  return (
    <section style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Track Output Routing</h2>
        <FieldStatusBadge status={worstStatus} />
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginTop: 8, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Track</th>
              {BUS_FIELDS.map((id) => (
                <th key={id} style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600 }}>
                  {BUS_LABELS[id]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {states.map((trackState, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '4px 8px', fontWeight: 500 }}>Track {i + 1}</td>
                {BUS_FIELDS.map((id) => {
                  const checked = trackState[id] === true || trackState[id] === 'ON'
                  return (
                    <td key={id} style={{ textAlign: 'center', padding: '4px 8px' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onFieldChange(i, id, e.target.checked)}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
