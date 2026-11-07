import type { TodoPriority } from '@/shared/types/api'
import { priorityConfig } from '@/features/todos/config/todoConfig'

export function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const config = priorityConfig[priority]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xs px-2 py-0.5 text-caption font-medium ${config.className}`}
      style={{ backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)` }}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {config.label}
    </span>
  )
}
