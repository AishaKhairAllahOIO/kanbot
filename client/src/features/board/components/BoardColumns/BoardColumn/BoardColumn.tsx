import { useId } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { TodoStatus } from '@/shared/types/api'
import { statusColor } from '@/features/todos/config/statusConfig'
import { ColumnBody, type ColumnBodyProps } from './ColumnBody'
import { ColumnHeader } from './ColumnHeader'

interface BoardColumnProps extends ColumnBodyProps {
  collapsed: boolean
  onToggleCollapsed: (status: TodoStatus) => void
}

export function BoardColumn({
  collapsed,
  onToggleCollapsed,
  ...bodyProps
}: BoardColumnProps) {
  const { status, todos } = bodyProps
  const { setNodeRef } = useDroppable({ id: `column:${status}` })
  const headingId = useId()
  const points = todos.reduce((sum, todo) => sum + (todo.storyPoints ?? 0), 0)

  return (
    <section
      ref={setNodeRef}
      data-board-status={status}
      data-collapsed={collapsed}
      role="group"
      aria-labelledby={headingId}
      className={`board-column flex min-w-0 snap-start flex-col overflow-hidden rounded-lg border-t-[3px] ${statusColor[status]} bg-sunken p-2 lg:w-full lg:px-1`}
    >
      <ColumnHeader
        status={status}
        headingId={headingId}
        count={todos.length}
        points={points}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
      />
      {!collapsed && <ColumnBody {...bodyProps} />}
    </section>
  )
}
