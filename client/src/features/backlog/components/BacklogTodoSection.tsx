import { ArrowDown, ChevronDown, ChevronRight, ListTodo } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MoveTodoRequest, Sprint, Todo } from '../../../shared/types/api'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Skeleton } from '../../../shared/components/Skeleton'
import { QuickCreateTodo } from '../../todos/components/QuickCreateTodo'
import { SortableTodoList } from '../../todos/components/SortableTodoList'

interface BacklogTodoSectionProps {
  projectId: string
  todos: Todo[]
  totalTodos: number
  totalPoints: number
  summaryLoading?: boolean
  sprints: Sprint[]
  filtersActive: boolean
  isSelected?: (todoId: string) => boolean
  onToggleSelect?: (todoId: string) => void
  onToggleSelectAll?: () => void
  isAllSelected?: boolean
  onClearFilters: () => void
  onOpenTodo: (todoId: string) => void
  onMoveTodo: (todoId: string, body: MoveTodoRequest) => void
  onDeleteTodo: (todo: Todo) => void
  onGenerateTodos: () => void
}

export function BacklogTodoSection({
  projectId,
  todos,
  totalTodos,
  totalPoints,
  summaryLoading = false,
  sprints,
  filtersActive,
  isSelected,
  onToggleSelect,
  onToggleSelectAll,
  isAllSelected = false,
  onClearFilters,
  onOpenTodo,
  onMoveTodo,
  onDeleteTodo,
  onGenerateTodos,
}: BacklogTodoSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollContentRef = useRef<HTMLDivElement>(null)
  const itemIds = todos.map((todo) => todo.id)
  const { setNodeRef, isOver } = useDroppable({
    id: 'list:backlog',
    data: { listId: 'backlog', itemIds },
    disabled: filtersActive || !expanded,
  })

  const updateScrollCue = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const hasMoreContent = container.scrollHeight > container.clientHeight + container.scrollTop + 8
    setCanScrollDown((current) => current === hasMoreContent ? current : hasMoreContent)
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    const content = scrollContentRef.current
    if (!container || !content || !expanded || todos.length === 0) return

    const resizeObserver = new ResizeObserver(updateScrollCue)
    resizeObserver.observe(container)
    resizeObserver.observe(content)
    const frame = requestAnimationFrame(updateScrollCue)
    container.addEventListener('scroll', updateScrollCue, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      container.removeEventListener('scroll', updateScrollCue)
    }
  }, [expanded, todos.length, updateScrollCue])

  return (
    <section
      ref={setNodeRef}
      className={`theme-card mt-5 overflow-hidden rounded-md border-s-2 border-s-brand ${isOver ? 'bg-sunken/50 outline outline-1 outline-line-strong outline-offset-1' : ''}`}
    >
      <div className="flex min-h-12 w-full items-center justify-between border-b border-line bg-brand-soft/50 px-3">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="flex min-h-12 flex-1 items-center gap-2 text-left transition-colors hover:text-brand-ink"
        >
          {expanded
            ? <ChevronDown aria-hidden="true" className="size-4 text-brand-ink" />
            : <ChevronRight aria-hidden="true" className="size-4 text-brand-ink" />}
          <span className="grid size-7 shrink-0 place-content-center rounded-sm bg-brand-soft text-brand-ink">
            <ListTodo aria-hidden="true" className="size-4" />
          </span>
          <span className="font-heading text-body font-semibold text-ink">Backlog</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2 py-0.5 text-caption font-medium tabular-nums text-muted">
            {filtersActive && <span className="text-brand-ink">{todos.length} shown ·</span>}
            {summaryLoading ? (
              <span role="status" aria-label="Loading backlog summary"><Skeleton className="h-3 w-24" /></span>
            ) : (
              <>{totalTodos} todos · {totalPoints} pts</>
            )}
          </span>
        </button>

        {onToggleSelectAll && todos.length > 0 && expanded && (
          <label className="flex cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1 text-caption text-muted transition-colors hover:bg-surface hover:text-ink">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={onToggleSelectAll}
              className="size-3.5 rounded-xs border-line-strong accent-info focus:ring-info"
            />
            <span>Select all</span>
          </label>
        )}
      </div>

      {expanded && (
        <>
          {filtersActive && (
            <p className="border-b border-line bg-warning/10 px-4 py-2 text-small text-ink">Clear filters to reorder.</p>
          )}
          {todos.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title={filtersActive ? 'No todos match' : 'Your backlog is empty'}
                description={filtersActive
                  ? 'Try a different search or clear the filters.'
                  : 'Create a todo or generate a few drafts with your AI teammate.'}
                action={filtersActive ? (
                  <Button onClick={onClearFilters}>Clear filters</Button>
                ) : (
                  <Button variant="primary" onClick={onGenerateTodos}>Generate with AI</Button>
                )}
              />
            </div>
          ) : (
            <div className="relative">
              <div ref={scrollContainerRef} className="max-h-[20rem] overflow-y-auto" aria-label="Backlog todos">
                <div ref={scrollContentRef}>
                  <SortableTodoList
                    todos={todos}
                    sprints={sprints}
                    canReorder={!filtersActive}
                    listId="backlog"
                    manageDragContext={false}
                    isSelected={isSelected}
                    onToggleSelect={onToggleSelect}
                    onOpen={onOpenTodo}
                    onMove={onMoveTodo}
                    onDelete={onDeleteTodo}
                  />
                </div>
              </div>
              {canScrollDown && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-gradient-to-t from-surface via-surface/90 to-transparent pb-1">
                  <button
                    type="button"
                    aria-label="Scroll backlog down"
                    onClick={() => scrollContainerRef.current?.scrollBy({ top: 180, behavior: 'smooth' })}
                    className="pointer-events-auto grid size-8 place-content-center rounded-full border border-line bg-surface text-brand-ink shadow-card transition-colors hover:bg-brand-soft"
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="border-t border-dashed border-line-strong bg-canvas/60 px-4 py-2 transition-colors focus-within:bg-brand-soft/30">
            <QuickCreateTodo projectId={projectId} variant="backlog" />
          </div>
        </>
      )}
    </section>
  )
}
