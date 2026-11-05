interface StatTileProps {
  label: string
  value: string | number
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <article className="theme-card px-4 py-3">
      <p className="text-caption text-muted">{label}</p>
      <p className="mt-1 font-heading text-title font-semibold tabular-nums text-ink">{value}</p>
    </article>
  )
}
