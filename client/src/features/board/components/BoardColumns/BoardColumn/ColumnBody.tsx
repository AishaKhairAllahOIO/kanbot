import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Inbox } from 'lucide-react'
import type { Todo, TodoStatus } from '@/shared/types/api'
import { TodoCard } from '@/features/todos/components/TodoCard'
import { statusNames, statusText } from '@/features/todos/config/statusConfig'

export interface ColumnBodyProps {
  status: TodoStatus
  todos: Todo[]
  onOpen: (todoId: string) => void
  onMove: (todoId: string, status: TodoStatus) => void
  onDelete: (todo: Todo) => void
  activeTodoId: string | null
  enableCardTouchDrag: boolean
  overTodoId: string | null
  showDropPlaceholder: boolean
  placeholderHeight?: number
  doneFlashTodoId: string | null
}

function DropPlaceholder({ height }: { height?: number }) {
  return (
    <div
      aria-hidden="true"
      className="board-drop-placeholder flex min-h-28 items-center justify-center rounded-md border-2 border-dashed border-brand bg-brand-soft text-caption font-medium text-brand-ink"
      style={height ? { height } : undefined}
    >
      Drop here
    </div>
  )
}

export function ColumnBody({
  status,
  todos,
  onOpen,
  onMove,
  onDelete,
  activeTodoId,
  enableCardTouchDrag,
  overTodoId,
  showDropPlaceholder,
  placeholderHeight,
  doneFlashTodoId,
}: ColumnBodyProps) {
  const hasInsertionTarget = todos.some((todo) => todo.id === overTodoId)

  return (
    <SortableContext
      items={todos.map((todo) => todo.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="flex flex-col gap-2">
        {todos.map((todo) => (
          <div key={todo.id} className="contents">
            {showDropPlaceholder && overTodoId === todo.id && (
              <DropPlaceholder height={placeholderHeight} />
            )}
            <TodoCard
              todo={todo}
              onOpen={onOpen}
              onMove={onMove}
              onDelete={onDelete}
              isDragging={todo.id === activeTodoId}
              enableCardTouchDrag={enableCardTouchDrag}
              isDoneFlash={todo.id === doneFlashTodoId}
            />
          </div>
        ))}
        {showDropPlaceholder && !hasInsertionTarget && (
          <DropPlaceholder height={placeholderHeight} />
        )}
        {todos.length === 0 && !showDropPlaceholder && (
          <div
            className={`flex flex-1 flex-col items-center justify-center gap-2 py-6 text-caption font-medium ${statusText[status]}`}
          >
            <Inbox aria-hidden="true" className="size-5" />
            <span>No tasks in {statusNames[status]}</span>
          </div>
        )}
      </div>
    </SortableContext>
  )
}
