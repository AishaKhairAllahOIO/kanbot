import type { SprintStatus } from '../../../shared/types/api'

const config = {
  planned: { label: 'Planned', className: 'border-info/20 bg-info/10 text-info' },
  active: { label: 'Active', className: 'border-brand-soft-line bg-brand-soft text-brand-ink' },
  completed: { label: 'Completed', className: 'border-success/20 bg-success/10 text-success' },
} satisfies Record<SprintStatus, { label: string; className: string }>

export function SprintStatusBadge({ status }: { status: SprintStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-caption font-medium ${className}`}>
      {label}
    </span>
  )
}
