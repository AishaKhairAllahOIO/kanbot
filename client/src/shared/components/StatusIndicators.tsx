import { Bookmark, Bug, ChevronDown, ChevronUp, ChevronsUp, Equal, SquareCheck } from 'lucide-react'
import type { TodoPriority, TodoStatus, TodoType } from '../types/api'

const statuses: Record<TodoStatus, { label: string; color: string; progress: number }> = {
  todo: { label: 'To Do', color: 'text-status-todo', progress: 0 },
  in_progress: { label: 'In Progress', color: 'text-status-in-progress', progress: 50 },
  in_review: { label: 'In Review', color: 'text-status-in-review', progress: 75 },
  done: { label: 'Done', color: 'text-status-done', progress: 100 },
}

const priorities = {
  low: { label: 'Low', icon: ChevronDown, color: 'text-priority-low' },
  medium: { label: 'Medium', icon: Equal, color: 'text-priority-medium' },
  high: { label: 'High', icon: ChevronUp, color: 'text-priority-high' },
  urgent: { label: 'Urgent', icon: ChevronsUp, color: 'text-priority-urgent' },
} satisfies Record<TodoPriority, { label: string; icon: typeof ChevronDown; color: string }>

const todoTypes = {
  task: { label: 'Task', icon: SquareCheck, color: 'text-type-task' },
  story: { label: 'Story', icon: Bookmark, color: 'text-type-story' },
  bug: { label: 'Bug', icon: Bug, color: 'text-type-bug' },
} satisfies Record<TodoType, { label: string; icon: typeof SquareCheck; color: string }>

export function StatusIcon({ status, showLabel = false }: { status: TodoStatus; showLabel?: boolean }) {
  const config = statuses[status]
  return (
    <span className={`inline-flex items-center gap-2 ${config.color}`} aria-label={config.label}>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 -rotate-90">
        {status === 'done' ? (
          <>
            <circle cx="8" cy="8" r="7" fill="currentColor" />
            <path d="m4.5 8 2.2 2.2 4.8-4.8" fill="none" stroke="var(--surface)" strokeWidth="1.5" />
          </>
        ) : (
          <>
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" opacity=".25" />
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${(config.progress / 100) * 37.7} 37.7`}
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      {showLabel && <span className="text-small text-ink">{config.label}</span>}
      {!showLabel && <span className="sr-only">{config.label}</span>}
    </span>
  )
}

export function PriorityBadge({ priority, showLabel = false }: { priority: TodoPriority; showLabel?: boolean }) {
  const config = priorities[priority]
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center gap-1 ${config.color}`}
      aria-label={`${config.label} priority`}
      title={`${config.label} priority`}
    >
      <Icon aria-hidden="true" className="size-4" />
      {showLabel && <span className="text-small">{config.label}</span>}
      {!showLabel && <span className="sr-only">{config.label} priority</span>}
    </span>
  )
}

export function TypeIcon({ type }: { type: TodoType }) {
  const config = todoTypes[type]
  const Icon = config.icon
  return (
    <span className={config.color} title={config.label} aria-label={config.label}>
      <Icon aria-hidden="true" className="size-4" />
      <span className="sr-only">{config.label}</span>
    </span>
  )
}

export function PointsChip({ points }: { points: number | null }) {
  return (
    <span
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-sunken text-caption tabular-nums text-ink"
      title={points === null ? 'Not estimated' : `${points} story points`}
    >
      {points ?? '–'}
    </span>
  )
}
