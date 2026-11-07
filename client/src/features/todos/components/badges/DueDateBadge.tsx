import { AlertCircle, Calendar, CalendarClock } from 'lucide-react'
import type { TodoStatus } from '@/shared/types/api'
import { getDueDateInfo } from '@/features/todos/utils/dueDates'

interface DueDateBadgeProps {
  dueDate: string | null | undefined
  status?: TodoStatus
  className?: string
  showIcon?: boolean
}

export function DueDateBadge({
  dueDate,
  status,
  className = '',
  showIcon = true,
}: DueDateBadgeProps) {
  const info = getDueDateInfo(dueDate, status)
  if (!info) return null

  let colorClasses = 'border-line text-muted bg-sunken'
  let Icon = Calendar

  if (info.isOverdue) {
    colorClasses = 'border-danger/30 text-danger bg-danger/10 font-semibold'
    Icon = AlertCircle
  } else if (info.isDueToday) {
    colorClasses = 'border-warning/40 text-warning bg-warning/10 font-medium'
    Icon = CalendarClock
  } else if (info.isDueTomorrow) {
    colorClasses = 'border-brand/40 text-brand-ink bg-brand-soft'
    Icon = CalendarClock
  } else if (status === 'done') {
    colorClasses = 'border-line text-subtle line-through opacity-75'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-caption tabular-nums ${colorClasses} ${className}`}
      title={`Due date: ${info.formatted}${info.isOverdue ? ' (Overdue)' : ''}`}
    >
      {showIcon && <Icon aria-hidden="true" className="size-3 shrink-0" />}
      <span>{info.label}</span>
    </span>
  )
}
