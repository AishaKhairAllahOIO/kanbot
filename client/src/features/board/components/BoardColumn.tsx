import { useId } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import type { Todo, TodoStatus } from '../../../shared/types/api'
import { TodoCard } from './TodoCard'

const names: Record<TodoStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

interface BoardColumnProps {
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
  collapsed: boolean
  onToggleCollapsed: (status: TodoStatus) => void
}

const statusColor: Record<TodoStatus, string> = {
  todo: 'border-t-status-todo',
  in_progress: 'border-t-status-in-progress',
  in_review: 'border-t-status-in-review',
  done: 'border-t-status-done',
}

const statusDot: Record<TodoStatus, string> = {
  todo: 'bg-status-todo',
  in_progress: 'bg-status-in-progress',
  in_review: 'bg-status-in-review',
  done: 'bg-status-done',
}

const statusText: Record<TodoStatus, string> = {
  todo: 'text-status-todo',
  in_progress: 'text-status-in-progress',
  in_review: 'text-status-in-review',
  done: 'text-status-done',
}

export function BoardColumn({
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
  collapsed,
  onToggleCollapsed,
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: `column:${status}` })
  const headingId = useId()
  const points = todos.reduce((sum, todo) => sum + (todo.storyPoints ?? 0), 0)
  const hasInsertionTarget = todos.some((todo) => todo.id === overTodoId)

  function renderPlaceholder() {
    return (
      <div
        aria-hidden="true"
        className="board-drop-placeholder flex min-h-28 items-center justify-center rounded-md border-2 border-dashed border-brand bg-brand-soft text-caption font-medium text-brand-ink"
        style={placeholderHeight ? { height: placeholderHeight } : undefined}
      >
        Drop here
      </div>
    )
  }

  return (
    <section
      ref={setNodeRef}
      data-board-status={status}
      data-collapsed={collapsed}
      role="group"
      aria-labelledby={headingId}
      className={`board-column flex min-w-0 snap-start flex-col rounded-lg border-t-[3px] ${statusColor[status]} bg-sunken p-2 ${
        collapsed ? 'md:w-14 md:flex-none md:items-center md:px-1' : 'md:min-w-[var(--board-column-min)]'
      }`}
    >
      <header className={`mb-3 flex w-full items-center gap-2 px-1 py-1 ${collapsed ? 'md:flex-col' : ''}`}>
        <button
          type="button"
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${names[status]} column`}
          aria-expanded={!collapsed}
          onClick={() => onToggleCollapsed(status)}
          className="hidden size-7 shrink-0 place-content-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-ink md:grid"
        >
          {collapsed
            ? <ChevronRight aria-hidden="true" className="size-4" />
            : <ChevronLeft aria-hidden="true" className="size-4" />}
        </button>
        {!collapsed ? (
          <>
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${statusDot[status]}`} />
            <h2 id={headingId} className="min-w-0 truncate text-subheading font-semibold text-ink">
              {names[status]}
            </h2>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface text-caption tabular-nums text-muted">
              {todos.length}
            </span>
            <span className="ms-auto shrink-0 text-caption tabular-nums text-muted">
              {points} pts
            </span>
          </>
        ) : (
          <>
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${statusDot[status]} md:hidden`} />
            <h2
              id={headingId}
              className="min-w-0 truncate text-subheading font-semibold text-ink md:overflow-visible md:whitespace-nowrap md:[writing-mode:vertical-rl] md:rotate-180 md:text-small"
            >
              {names[status]}
            </h2>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface text-caption tabular-nums text-muted">
              {todos.length}
            </span>
          </>
        )}
      </header>

      {!collapsed && (
        <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {todos.map((todo) => (
              <div key={todo.id} className="contents">
                {showDropPlaceholder && overTodoId === todo.id && renderPlaceholder()}
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
            {showDropPlaceholder && !hasInsertionTarget && renderPlaceholder()}
            {todos.length === 0 && !showDropPlaceholder && (
              <div className={`flex flex-1 flex-col items-center justify-center gap-2 py-6 text-caption font-medium ${statusText[status]}`}>
                <Inbox aria-hidden="true" className="size-5" />
                <span>No tasks in {names[status]}</span>
              </div>
            )}
          </div>
        </SortableContext>
      )}
    </section>
  )
}
