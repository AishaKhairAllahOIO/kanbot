import type { ReactNode } from 'react'
import type { Todo } from '@/shared/types/api'
import { TypeBadge } from '@/features/todos/components/badges'

export function CardHeader({
  todo,
  actions,
}: {
  todo: Todo
  actions?: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <TypeBadge type={todo.type} />
      <span className="min-w-0 truncate font-mono text-key text-muted">
        {todo.key}
      </span>
      <span className="flex-1" />
      {actions}
    </div>
  )
}
