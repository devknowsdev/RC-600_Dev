type Props = {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}

export function ToggleField({ label, checked, onChange }: Props) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}
