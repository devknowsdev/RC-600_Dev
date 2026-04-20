type Props = {
  label: string
  value: string
  options: string[]
  onChange: (next: string) => void
}

export function EnumField({ label, value, options, onChange }: Props) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
