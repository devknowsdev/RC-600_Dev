type Props = {
  label: string
  value: string
  onChange: (v: string) => void
}

export function TextField({ label, value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 6 }}
      />
    </div>
  )
}
