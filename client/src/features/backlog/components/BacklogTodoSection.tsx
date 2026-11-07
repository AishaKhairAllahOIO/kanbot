import { ArrowDown, ArrowUp, ListTodo } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MoveTodoRequest, Sprint, Todo } from '@/shared/types/api'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { Skeleton } from '@/shared/components/Skeleton'
import { QuickCreateTodo } from '@/features/todos/components/QuickCreateTodo'
import { SortableTodoList } from '@/features/todos/components/SortableTodoList'
import { CollapsibleSectionHeader } from './CollapsibleSectionHeader'
import { useUiPreferencesStore } from '@/app/stores/uiPreferencesStore'
import { scrollBacklogSectionIntoView } from '@/features/backlog/utils/scrollBacklogSection'

interface BacklogTodoSectionProps {
  highlightedTodoIds?: ReadonlySet<string>
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
  highlightedTodoIds,
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
  const sectionKey = `backlog:${projectId}:todos`
  const isCollapsed = useUiPreferencesStore(
    (state) => state.collapsedSections[sectionKey] ?? false,
  )
  const toggleCollapsed = useUiPreferencesStore((state) => state.toggleCollapsed)
  const expanded = !isCollapsed
  const [scrollEdges, setScrollEdges] = useState({ top: false, bottom: false })
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
    const top = container.scrollTop > 8
    const bottom = container.scrollHeight > container.clientHeight + container.scrollTop + 8
    setScrollEdges((current) =>
      current.top === top && current.bottom === bottom ? current : { top, bottom },
    )
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

  useEffect(() => {
    if (!highlightedTodoIds?.size || !expanded) return

    const container = scrollContainerRef.current
    if (!container) return

    const addedRows = Array.from(
      container.querySelectorAll<HTMLElement>('[data-todo-id]'),
    ).filter((row) => highlightedTodoIds.has(row.dataset.todoId ?? ''))
    if (addedRows.length === 0) return

    const section = document.getElementById('backlog-todos-section')
    if (section) scrollBacklogSectionIntoView(section)

    const containerRect = container.getBoundingClientRect()
    const firstRowRect = addedRows[0].getBoundingClientRect()
    const lastRowRect = addedRows[addedRows.length - 1].getBoundingClientRect()
    const firstRowTop = firstRowRect.top - containerRect.top + container.scrollTop
    const lastRowBottom = lastRowRect.bottom - containerRect.top + container.scrollTop
    const visibleTop = container.scrollTop
    const visibleBottom = visibleTop + container.clientHeight
    let targetScrollTop: number | undefined

    if (lastRowBottom - firstRowTop > container.clientHeight) {
      targetScrollTop = firstRowTop
    } else if (firstRowTop < visibleTop) {
      targetScrollTop = firstRowTop
    } else if (lastRowBottom > visibleBottom) {
      targetScrollTop = lastRowBottom - container.clientHeight
    }

    if (targetScrollTop !== undefined) {
      container.scrollTo({
        top: targetScrollTop,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      })
    }
  }, [expanded, highlightedTodoIds, todos])

  return (
    <section
      id="backlog-todos-section"
      ref={setNodeRef}
      className={`theme-card mt-5 scroll-mt-20 overflow-hidden rounded-md border-s-2 border-s-brand ${isOver ? 'bg-sunken/50 outline outline-1 outline-line-strong outline-offset-1' : ''}`}
    >
      <CollapsibleSectionHeader
        variant="backlog"
        expanded={expanded}
        onToggle={() => toggleCollapsed(sectionKey)}
        actions={onToggleSelectAll && todos.length > 0 && expanded ? (
          <label className="flex cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1 text-caption text-muted">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={onToggleSelectAll}
              className="size-3.5 rounded-sm border-line-strong accent-brand"
            />
            <span>Select all</span>
          </label>
        ) : undefined}
      >
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
      </CollapsibleSectionHeader>

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
              <div ref={scrollContainerRef} className="scrollbar-hidden max-h-[20rem] overflow-y-auto" aria-label="Backlog todos">
                <div ref={scrollContentRef}>
                  <SortableTodoList
                    todos={todos}
                    sprints={sprints}
                    canReorder={!filtersActive}
                    listId="backlog"
                    manageDragContext={false}
                    isSelected={isSelected}
                    highlightedTodoIds={highlightedTodoIds}
                    onToggleSelect={onToggleSelect}
                    onOpen={onOpenTodo}
                    onMove={onMoveTodo}
                    onDelete={onDeleteTodo}
                  />
                </div>
              </div>
              {scrollEdges.top && (
                <div className="pointer-events-none absolute inset-x-0 top-0 flex h-12 items-start justify-center bg-gradient-to-b from-surface via-surface/90 to-transparent pt-1">
                  <button
                    type="button"
                    aria-label="Scroll backlog up"
                    onClick={() => scrollContainerRef.current?.scrollBy({ top: -44, behavior: 'smooth' })}
                    className="pointer-events-auto grid size-8 place-content-center rounded-full border border-line bg-surface text-brand-ink shadow-card transition-colors hover:bg-brand-soft"
                  >
                    <ArrowUp aria-hidden="true" className="size-4" />
                  </button>
                </div>
              )}
              {scrollEdges.bottom && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-gradient-to-t from-surface via-surface/90 to-transparent pb-1">
                  <button
                    type="button"
                    aria-label="Scroll backlog down"
                    onClick={() => scrollContainerRef.current?.scrollBy({ top: 44, behavior: 'smooth' })}
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
