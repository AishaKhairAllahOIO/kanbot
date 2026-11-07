import type { TodoType } from '@/shared/types/api'
import { typeConfig } from '@/features/todos/config/todoConfig'

export function TypeBadge({ type }: { type: TodoType }) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-xs px-1.5 py-0.5 text-caption font-medium"
      style={{
        backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
        color: config.color,
      }}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {config.label}
    </span>
  )
}
