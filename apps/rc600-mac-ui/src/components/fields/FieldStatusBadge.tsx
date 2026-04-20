type Props = {
  status: 'confirmed' | 'provisional' | 'unknown'
}

export function FieldStatusBadge({ status }: Props) {
  const color =
    status === 'confirmed'
      ? 'green'
      : status === 'provisional'
      ? 'orange'
      : 'gray'

  return (
    <span style={{ color, fontSize: 12 }}>
      {status}
    </span>
  )
}
