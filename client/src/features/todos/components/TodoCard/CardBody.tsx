import { CheckCircle2 } from 'lucide-react'
import type { Todo } from '@/shared/types/api'
import { DueDateBadge, PointsPill, PriorityBadge } from '@/features/todos/components/badges'
import { LabelBadge } from '@/features/todos/components/labels'
import { statusText } from '@/features/todos/config/statusConfig'

export function CardBody({
  todo,
  onOpen,
}: {
  todo: Todo
  onOpen?: () => void
}) {
  return (
    <>
      <div className="mt-2 flex items-start gap-1.5">
        {todo.status === 'done' && (
          <CheckCircle2
            aria-hidden="true"
            className={`mt-0.5 size-4 shrink-0 ${statusText.done}`}
          />
        )}
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="line-clamp-3 min-w-0 flex-1 text-left text-body font-medium text-ink"
            title={todo.title}
          >
            {todo.title}
          </button>
        ) : (
          <p className="line-clamp-3 min-w-0 flex-1 text-body font-medium text-ink">
            {todo.title}
          </p>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={todo.priority} />
        {todo.dueDate && (
          <DueDateBadge dueDate={todo.dueDate} status={todo.status} />
        )}
        {todo.labels &&
          todo.labels.map((label) => (
            <LabelBadge key={label} projectId={todo.projectId} label={label} />
          ))}
        <span className="ml-auto">
          <PointsPill todo={todo} />
        </span>
      </div>
    </>
  )
}
