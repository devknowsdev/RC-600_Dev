import { buildMemorySummary } from './buildMemorySummary'
import type { CanonicalMemoryState } from './buildMemorySummary'

type Props = {
  memory: CanonicalMemoryState
}

export function MemorySummaryPanel({ memory }: Props) {
  const lines = buildMemorySummary(memory)

export function MemorySummaryPanel({ memory }: Props) {
  const lines = buildMemorySummary(memory)
  return (
    <section style={{ marginTop: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>Summary</h2>
      <ul style={{ paddingLeft: 16 }}>
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </section>
  )
}
