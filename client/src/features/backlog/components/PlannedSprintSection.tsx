import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Play, Trash2 } from 'lucide-react'
import { ApiError, getErrorMessage } from '../../../shared/api/errors'
import type { Sprint, Todo } from '../../../shared/types/api'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Modal } from '../../../shared/components/Modal'
import { Skeleton } from '../../../shared/components/Skeleton'
import { SortableTodoList } from '../../todos/components/SortableTodoList'
import { useMoveTodo } from '../../todos/hooks/useMoveTodo'
import { useTodos } from '@/features/todos/hooks'
import { useDeleteSprint } from '../../sprints/hooks/useDeleteSprint'
import { formatSprintDates } from '../../sprints/utils/sprintDates'
import { SprintFormDialog } from '../../sprints/components/SprintFormDialog'
import { StartSprintDialog } from '../../sprints/components/StartSprintDialog'

interface PlannedSprintSectionProps {
  projectId: string
  sprint: Sprint
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
  sprints,
  activeSprint,
  onOpenTodo,
  onDeleteTodo,
  isSelected,
  onToggleSelect,
  onToggleSelectAll,
}: PlannedSprintSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const todosQuery = useTodos(projectId, { sprintId: sprint.id })
  const todoMutations = useMoveTodo(projectId)
  const sprintMutations = useDeleteSprint(projectId)
  const todos = todosQuery.data?.todos ?? []
  const itemIds = todos.map((todo) => todo.id)
  const { setNodeRef, isOver } = useDroppable({
    id: `list:${sprint.id}`,
    data: { listId: sprint.id, itemIds },
  })

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
      ref={setNodeRef}
      className={`theme-card mb-4 overflow-hidden rounded-md border-s-2 border-s-info ${isOver ? 'bg-sunken/50 outline outline-1 outline-line-strong outline-offset-1' : ''}`}
    >
      <div className="flex min-h-12 flex-wrap items-center gap-3 border-b border-line bg-info/5 px-3 py-2">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="grid size-7 shrink-0 place-content-center rounded-sm text-muted hover:bg-surface"
        >
          {expanded ? <ChevronDown aria-hidden="true" className="size-4" /> : <ChevronRight aria-hidden="true" className="size-4" />}
        </button>
        <div className="min-w-40 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-heading text-body font-semibold">{sprint.name}</h3>
            <span className="rounded-full bg-info/10 px-2 py-0.5 text-caption font-medium text-info">Planned</span>
            <span className="text-caption text-muted">{formatSprintDates(sprint.startDate, sprint.endDate)}</span>
            {sprint.goal && <span className="hidden text-caption text-muted 2xl:inline">· {sprint.goal}</span>}
          </div>
        </div>
        {todosQuery.isPending ? (
          <Skeleton className="h-6 w-24 rounded-full" />
        ) : (
          <span className="rounded-full bg-surface px-2.5 py-1 text-caption font-medium tabular-nums text-muted">
            {sprint.stats.totalTodos} todos · {sprint.stats.totalPoints} pts
          </span>
        )}
        {todos.length > 0 && (
          <label className="flex cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1 text-caption text-muted transition-colors hover:bg-surface hover:text-ink">
            <input
              type="checkbox"
              checked={todos.every((todo) => isSelected(todo.id))}
              onChange={() => onToggleSelectAll(todos.map((todo) => todo.id))}
              className="size-3.5 rounded-xs border-line-strong accent-info focus:ring-info"
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
            <DropdownMenu.Content align="end" className="z-popover min-w-40 rounded-md border border-line bg-raised p-1 shadow-pop">
              <DropdownMenu.Item className="menu-item" onSelect={() => setEditOpen(true)}>
                <Pencil aria-hidden="true" className="size-4" /> Edit sprint
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="menu-item text-brand-ink"
                disabled={startBlocked}
                onSelect={() => setStartOpen(true)}
              >
                <Play aria-hidden="true" className="size-4" /> Start sprint
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <DropdownMenu.Item className="menu-item text-danger" onSelect={() => setDeleteOpen(true)}>
                <Trash2 aria-hidden="true" className="size-4" /> Delete sprint
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      {startBlocked && <p className="border-t border-line px-4 py-2 text-small text-muted">{blockedMessage}</p>}
      {expanded && (
        <div>
          {todosQuery.isPending ? (
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
            <SortableTodoList
              todos={todos}
              sprints={sprints}
              canReorder
              listId={sprint.id}
              manageDragContext={false}
              isSelected={isSelected}
              onToggleSelect={onToggleSelect}
              onOpen={onOpenTodo}
              onMove={(todoId, body) => todoMutations.mutate({ todoId, body: { ...body, sprintId: sprint.id } })}
              onDelete={onDeleteTodo}
            />
          )}
        </div>
      )}
      <SprintFormDialog open={editOpen} projectId={projectId} sprint={sprint} onOpenChange={setEditOpen} />
      {startOpen && <StartSprintDialog open sprint={sprint} onOpenChange={setStartOpen} />}
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
