import { buildMemorySummary } from './buildMemorySummary'

export function MemorySummaryPanel({ tracks }: any) {
  const lines = buildMemorySummary(tracks)

  return (
    <section style={{ marginTop: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>Summary</h2>

      <ul style={{ paddingLeft: 16 }}>
        {lines.map((line: string, i: number) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </section>
  )
}
