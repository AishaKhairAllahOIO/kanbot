import { useCallback, useEffect, useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowDown, ArrowUp, History, MoreHorizontal, Pencil, Play, Trash2 } from 'lucide-react'
import { ApiError, getErrorMessage } from '@/shared/api/errors'
import type { Sprint, Todo } from '@/shared/types/api'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { Modal } from '@/shared/components/Modal'
import { Skeleton } from '@/shared/components/Skeleton'
import { Tooltip } from '@/shared/components/Tooltip'
import { SortableTodoList } from '@/features/todos/components/SortableTodoList'
import { useMoveTodo } from '@/features/todos/hooks/useMoveTodo'
import { useTodos } from '@/features/todos/hooks'
import { useDeleteSprint } from '@/features/sprints/hooks/useDeleteSprint'
import { formatSprintDates } from '@/features/sprints/utils/sprintDates'
import { SprintFormDialog } from '@/features/sprints/components/SprintFormDialog'
import { StartSprintDialog } from '@/features/sprints/components/StartSprintDialog'
import { CollapsibleSectionHeader } from './CollapsibleSectionHeader'
import { useUiPreferencesStore } from '@/app/stores/uiPreferencesStore'
import { scrollBacklogSectionIntoView } from '@/features/backlog/utils/scrollBacklogSection'

interface PlannedSprintSectionProps {
  projectId: string
  sprint: Sprint
  isHighlighted?: boolean
  sprints: Sprint[]
  activeSprint: Sprint | null
  onOpenTodo: (todoId: string) => void
  onDeleteTodo: (todo: Todo) => void
  isSelected: (todoId: string) => boolean
  onToggleSelect: (todoId: string) => void
  onToggleSelectAll: (todoIds: string[]) => void
}

export function PlannedSprintSection({
  projectId,
  sprint,
  isHighlighted = false,
  sprints,
  activeSprint,
  onOpenTodo,
  onDeleteTodo,
  isSelected,
  onToggleSelect,
  onToggleSelectAll,
}: PlannedSprintSectionProps) {
  const sectionKey = `backlog:sprint:${sprint.id}`
  const isCollapsed = useUiPreferencesStore(
    (state) => state.collapsedSections[sectionKey] ?? true,
  )
  const toggleCollapsed = useUiPreferencesStore((state) => state.toggleCollapsed)
  const expanded = !isCollapsed
  const [editOpen, setEditOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [scrollEdges, setScrollEdges] = useState({ top: false, bottom: false })
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollContentRef = useRef<HTMLDivElement>(null)
  const todosQuery = useTodos(projectId, { sprintId: sprint.id })
  const todoMutations = useMoveTodo(projectId)
  const sprintMutations = useDeleteSprint(projectId)
  const todos = todosQuery.data?.todos ?? []
  const itemIds = todos.map((todo) => todo.id)
  const { setNodeRef, isOver } = useDroppable({
    id: `list:${sprint.id}`,
    data: { listId: sprint.id, itemIds },
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
    if (!isHighlighted) return

    const frame = window.requestAnimationFrame(() => {
      const section = document.getElementById(`backlog-sprint-${sprint.id}`)
      if (section) scrollBacklogSectionIntoView(section)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isHighlighted, sprint.id])

  async function deleteSprint() {
    setDeleteError('')
    try {
      await sprintMutations.mutateAsync(sprint.id)
      setDeleteOpen(false)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        setDeleteOpen(false)
        return
      }
      setDeleteError(getErrorMessage(error))
    }
  }

  const startBlocked = Boolean(activeSprint)
  const blockedMessage = activeSprint
    ? `Complete “${activeSprint.name}” before starting another sprint.`
    : ''

  return (
    <section
      id={`backlog-sprint-${sprint.id}`}
      ref={setNodeRef}
      className={`theme-card mb-4 scroll-mt-20 overflow-hidden rounded-md border-s-2 border-s-info transition-shadow ${isHighlighted ? 'ring-2 ring-inset ring-info' : ''} ${isOver ? 'bg-sunken/50 outline outline-1 outline-line-strong outline-offset-1' : ''}`}
    >
      <CollapsibleSectionHeader
        variant="sprint"
        expanded={expanded}
        onToggle={() => toggleCollapsed(sectionKey, true)}
        actions={
          <>
            {todosQuery.isLoading ? (
              <Skeleton className="h-6 w-24 rounded-full" />
            ) : (
              <span className="rounded-full bg-surface px-2.5 py-1 text-caption font-medium tabular-nums text-muted">
                {sprint.stats.totalTodos} todos · {sprint.stats.totalPoints} pts
              </span>
            )}
            {todos.length > 0 && (
              <label className="flex cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1 text-caption text-muted">
                <input
                  type="checkbox"
                  checked={todos.every((todo) => isSelected(todo.id))}
                  onChange={() => onToggleSelectAll(todos.map((todo) => todo.id))}
                  className="size-3.5 rounded-sm border-line-strong accent-info"
                />
                <span>Select all</span>
              </label>
            )}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button type="button" aria-label={`Actions for ${sprint.name}`} className="rounded-sm p-2 text-muted hover:bg-sunken">
                  <MoreHorizontal aria-hidden="true" className="size-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" className="z-popover rounded-md border border-line bg-raised p-1 shadow-pop">
                  <DropdownMenu.Item className="menu-item" onSelect={() => setEditOpen(true)}>
                    <Pencil aria-hidden="true" className="size-4" /> Edit sprint
                  </DropdownMenu.Item>
                  {startBlocked ? (
                    <Tooltip content={blockedMessage}>
                      <span className="block" tabIndex={0}>
                        <DropdownMenu.Item
                          className="menu-item text-brand-ink"
                          disabled
                        >
                          <Play aria-hidden="true" className="size-4" /> Start sprint
                        </DropdownMenu.Item>
                      </span>
                    </Tooltip>
                  ) : (
                    <DropdownMenu.Item
                      className="menu-item text-brand-ink"
                      onSelect={() => setStartOpen(true)}
                    >
                      <Play aria-hidden="true" className="size-4" /> Start sprint
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Separator className="my-1 h-px bg-line" />
                  <DropdownMenu.Item className="menu-item text-danger" onSelect={() => setDeleteOpen(true)}>
                    <Trash2 aria-hidden="true" className="size-4" /> Delete sprint
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </>
        }
      >
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-7 shrink-0 place-content-center rounded-sm bg-info/10 text-info">
              <History aria-hidden="true" className="size-4" />
            </span>
            <h3 className="font-heading text-body font-semibold">{sprint.name}</h3>
            <span className="rounded-full bg-info/10 px-2 py-0.5 text-caption font-medium text-info">Planned</span>
            <span className="text-caption text-muted">{formatSprintDates(sprint.startDate, sprint.endDate)}</span>
            {sprint.goal && <span className="hidden text-caption text-muted 2xl:inline">· {sprint.goal}</span>}
          </div>
      </CollapsibleSectionHeader>
      {expanded && (
        <div>
          {todosQuery.isLoading ? (
            <div className="grid gap-1 py-2" role="status" aria-label="Loading sprint todos">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex min-h-11 items-center gap-3 px-3">
                  <Skeleton className="size-6" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="size-6 rounded-full" />
                </div>
              ))}
            </div>
          ) : todosQuery.isError ? (
            <EmptyState
              title="Sprint todos could not be loaded"
              description={getErrorMessage(todosQuery.error)}
              error
              action={<Button onClick={() => void todosQuery.refetch()}>Try again</Button>}
            />
          ) : todos.length === 0 ? (
            <EmptyState
              title="No todos in this sprint"
              description="Move todos here from the backlog to prepare this sprint."
              accent="info"
            />
          ) : (
            <div className="relative">
              <div
                ref={scrollContainerRef}
                className="scrollbar-hidden max-h-[20rem] overflow-y-auto"
                aria-label={`${sprint.name} todos`}
              >
                <div ref={scrollContentRef}>
                  <SortableTodoList
                    todos={todos}
                    sprints={sprints}
                    canReorder
                    listId={sprint.id}
                    manageDragContext={false}
                    isSelected={isSelected}
                    onToggleSelect={onToggleSelect}
                    onOpen={onOpenTodo}
                    onMove={(todoId, body) =>
                      todoMutations.mutate({
                        todoId,
                        body: {
                          ...body,
                          sprintId:
                            body.sprintId === undefined
                              ? sprint.id
                              : body.sprintId,
                        },
                      })
                    }
                    onDelete={onDeleteTodo}
                  />
                </div>
              </div>
              {scrollEdges.top && (
                <div className="pointer-events-none absolute inset-x-0 top-0 flex h-12 items-start justify-center bg-gradient-to-b from-surface via-surface/90 to-transparent pt-1">
                  <button
                    type="button"
                    aria-label={`Scroll ${sprint.name} up`}
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
                    aria-label={`Scroll ${sprint.name} down`}
                    onClick={() => scrollContainerRef.current?.scrollBy({ top: 44, behavior: 'smooth' })}
                    className="pointer-events-auto grid size-8 place-content-center rounded-full border border-line bg-surface text-brand-ink shadow-card transition-colors hover:bg-brand-soft"
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {(editOpen || startOpen) && (
        <>
          {editOpen && (
            <SprintFormDialog open projectId={projectId} sprint={sprint} onOpenChange={setEditOpen} />
          )}
          {startOpen && <StartSprintDialog open sprint={sprint} onOpenChange={setStartOpen} />}
        </>
      )}
      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete “${sprint.name}”?`}
        description={`Its ${sprint.stats.totalTodos} todos will move back to the backlog.`}
        size="confirm"
      >
        <div className="grid gap-4">
          {deleteError && <p role="alert" className="text-small text-danger">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={sprintMutations.isPending} onClick={() => void deleteSprint()}>Delete sprint</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
