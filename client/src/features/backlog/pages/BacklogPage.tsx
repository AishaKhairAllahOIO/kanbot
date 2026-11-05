import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router'
import type { Todo, TodoPriority, TodoType } from '../../../shared/types/api'
import { ApiError, getErrorMessage } from '../../../shared/api/errors'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Modal } from '../../../shared/components/Modal'
import { Skeleton } from '../../../shared/components/Skeleton'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle'
import { useTodos } from '../../todos/hooks/useTodos'
import { useRemoveTodo } from '@/features/todos/hooks'
import { useMoveTodo } from '@/features/todos/hooks'
import { TodoDetailsDialog } from '../../todos/components/TodoDetailsDialog'
import { useSprints } from '../../sprints/hooks/useSprints'
import { PlannedSprintSection } from '../components/PlannedSprintSection'
import { SprintFormDialog } from '../../sprints/components/SprintFormDialog'
import { GenerateTodosDialog } from '../../ai/components/GenerateTodosDialog'
import { PlanSprintDialog } from '../../ai/components/PlanSprintDialog'
import { Topbar } from '@/app/layouts'
import { BacklogToolbar } from '../components/BacklogToolbar'
import { BacklogTodoSection } from '../components/BacklogTodoSection'
import { BulkActionsBar } from '../../todos/components/BulkActionsBar'
import { useBulkTodoActions } from '../../todos/hooks/useBulkTodoActions'
import { LabelManagementDialog } from '../../todos/components/LabelManagementDialog'
import { SprintTemplateDialog } from '../../sprints/components/SprintTemplateDialog'
import { exportTodosToCsv, exportTodosToMarkdown } from '../../todos/utils/exportTodos'

interface TodoListDragData {
  listId: string
  itemIds: string[]
  todoKey?: string
  todo?: Todo
}

const listAwareCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  const pointerItemCollisions = pointerCollisions.filter(({ id }) => !String(id).startsWith('list:'))
  if (pointerItemCollisions.length > 0) return pointerItemCollisions
  if (pointerCollisions.length > 0) return pointerCollisions

  return closestCenter(args)
}

export function BacklogPage() {
  useDocumentTitle('Backlog')
  const { projectId = '' } = useParams()
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<TodoPriority | ''>('')
  const [type, setType] = useState<TodoType | ''>('')
  const [label, setLabel] = useState('')
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const [deletingTodo, setDeletingTodo] = useState<Todo>()
  const [deleteError, setDeleteError] = useState('')
  const [createSprintOpen, setCreateSprintOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [manageLabelsOpen, setManageLabelsOpen] = useState(false)
  const [sprintTemplateOpen, setSprintTemplateOpen] = useState(false)
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null)

  const debouncedSearch = useDebouncedValue(search)
  const query = {
    sprintId: 'backlog' as const,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(priority ? { priority } : {}),
    ...(type ? { type } : {}),
  }
  const todosQuery = useTodos(projectId, query)
  const allTodosQuery = useTodos(projectId, { sprintId: 'backlog' })
  const sprintsQuery = useSprints(projectId)
  const todoMove = useMoveTodo(projectId)
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const todoRemove = useRemoveTodo(projectId)
  const bulk = useBulkTodoActions(projectId)

  const todos = useMemo(() => todosQuery.data?.todos ?? [], [todosQuery.data?.todos])
  const allTodos = useMemo(() => allTodosQuery.data?.todos ?? [], [allTodosQuery.data?.todos])
  const sprints = sprintsQuery.data?.sprints ?? []
  const plannedSprints = sprints.filter((sprint) => sprint.status === 'planned')
  const activeSprint = sprints.find((sprint) => sprint.status === 'active') ?? null

  const availableLabels = useMemo(() => {
    const set = new Set<string>()
    allTodos.forEach((t) => t.labels.forEach((l) => set.add(l)))
    return Array.from(set).sort()
  }, [allTodos])

  const filteredTodos = useMemo(() => {
    if (!label) return todos
    return todos.filter((todo) => todo.labels.includes(label))
  }, [todos, label])

  const filtersActive = Boolean(search.trim() || priority || type || label)
  const totalPoints = allTodos.reduce((sum, todo) => sum + (todo.storyPoints ?? 0), 0)

  function handleCrossListDragEnd(event: DragEndEvent) {
    setDraggedTodo(null)
    if (!event.over || event.active.id === event.over.id) return
    const activeData = event.active.data.current as TodoListDragData | undefined
    const overData = event.over.data.current as TodoListDragData | undefined
    if (!activeData || !overData) return

    const droppingOnList = String(event.over.id).startsWith('list:')
    const sameList = activeData.listId === overData.listId
    const overIndex = overData.itemIds.indexOf(String(event.over.id))
    const position = droppingOnList
      ? overData.itemIds.length - Number(sameList)
      : overIndex
    if (position < 0) return

    todoMove.mutate({
      todoId: String(event.active.id),
      body: {
        sprintId: overData.listId === 'backlog' ? null : overData.listId,
        position,
      },
    })
  }

  async function deleteTodo() {
    if (!deletingTodo) return
    setDeleteError('')
    try {
      await todoRemove.mutateAsync(deletingTodo.id)
      setDeletingTodo(undefined)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        setDeletingTodo(undefined)
        return
      }
      setDeleteError(getErrorMessage(error))
    }
  }

  function clearFilters() {
    setSearch('')
    setPriority('')
    setType('')
    setLabel('')
  }

  return (
    <section>
      <Topbar
        title="Backlog"
        meta={allTodosQuery.isPending
          ? <span role="status" aria-label="Loading backlog summary"><Skeleton className="h-4 w-24" /></span>
          : <span className="shrink-0">{allTodos.length} todos · {totalPoints} pts</span>}
      />
      <BacklogToolbar
        search={search}
        setSearch={setSearch}
        priority={priority}
        setPriority={setPriority}
        type={type}
        setType={setType}
        label={label}
        setLabel={setLabel}
        availableLabels={availableLabels}
        onClearFilters={clearFilters}
        onManageLabels={() => setManageLabelsOpen(true)}
        onOpenSprintTemplate={() => setSprintTemplateOpen(true)}
        onExportCsv={() => exportTodosToCsv(allTodos, `${projectId}-backlog.csv`)}
        onExportMarkdown={() => exportTodosToMarkdown(allTodos, `Project Backlog`, `${projectId}-backlog.md`)}
        onGenerate={() => setGenerateOpen(true)}
        onPlanSprint={() => setPlanOpen(true)}
        onCreateSprint={() => setCreateSprintOpen(true)}
      />

      <DndContext
        sensors={dragSensors}
        collisionDetection={listAwareCollisionDetection}
        onDragStart={({ active }) => {
          const data = active.data.current as TodoListDragData | undefined
          setDraggedTodo(data?.todo ?? null)
        }}
        onDragEnd={handleCrossListDragEnd}
        onDragCancel={() => setDraggedTodo(null)}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => {
              const data = active.data.current as TodoListDragData | undefined
              return `Picked up ${data?.todoKey ?? active.id}.`
            },
            onDragOver: ({ active, over }) => {
              const data = active.data.current as TodoListDragData | undefined
              return over ? `Moving ${data?.todoKey ?? active.id}.` : ''
            },
            onDragEnd: ({ active, over }) => {
              const data = active.data.current as TodoListDragData | undefined
              return over ? `Dropped ${data?.todoKey ?? active.id}.` : ''
            },
            onDragCancel: ({ active }) => {
              setDraggedTodo(null)
              const data = active.data.current as TodoListDragData | undefined
              return `Cancelled moving ${data?.todoKey ?? active.id}.`
            },
          },
        }}
      >
      <div className="page-gutter pb-8 pt-4">
        {todosQuery.isError && (
          <div className="mb-4">
            <EmptyState
              title="Backlog could not be loaded"
              description={getErrorMessage(todosQuery.error)}
              error
              action={<Button onClick={() => void todosQuery.refetch()}>Try again</Button>}
            />
          </div>
        )}
        {allTodosQuery.isError && (
          <div className="mb-4">
            <EmptyState
              title="Backlog details could not be loaded"
              description={getErrorMessage(allTodosQuery.error)}
              error
              action={<Button onClick={() => void allTodosQuery.refetch()}>Try again</Button>}
            />
          </div>
        )}
        {sprintsQuery.isError && (
          <div className="mb-4">
            <EmptyState
              title="Sprints could not be loaded"
              description={getErrorMessage(sprintsQuery.error)}
              error
              action={<Button onClick={() => void sprintsQuery.refetch()}>Try again</Button>}
            />
          </div>
        )}
        {sprintsQuery.isPending && (
          <div className="mb-4 grid gap-3" role="status" aria-label="Loading planned sprints">
            <SprintSectionSkeleton />
          </div>
        )}
        {plannedSprints.map((sprint) => (
          <PlannedSprintSection
            key={sprint.id}
            projectId={projectId}
            sprint={sprint}
            sprints={sprints}
            activeSprint={activeSprint}
            onOpenTodo={setSelectedTodoId}
            onDeleteTodo={setDeletingTodo}
            isSelected={bulk.isSelected}
            onToggleSelect={bulk.toggle}
            onToggleSelectAll={bulk.toggleAll}
          />
        ))}

        {todosQuery.isPending ? (
          <BacklogLoadingSkeleton />
        ) : !todosQuery.isError ? (
          <BacklogTodoSection
            projectId={projectId}
            todos={filteredTodos}
            totalTodos={allTodos.length}
            totalPoints={totalPoints}
            summaryLoading={allTodosQuery.isPending}
            sprints={sprints}
            filtersActive={filtersActive}
            isSelected={bulk.isSelected}
            onToggleSelect={bulk.toggle}
            onToggleSelectAll={() => bulk.toggleAll(filteredTodos.map((t) => t.id))}
            isAllSelected={filteredTodos.length > 0 && filteredTodos.every((t) => bulk.isSelected(t.id))}
            onClearFilters={clearFilters}
            onOpenTodo={setSelectedTodoId}
            onMoveTodo={(todoId, body) => todoMove.mutate({ todoId, body })}
            onDeleteTodo={setDeletingTodo}
            onGenerateTodos={() => setGenerateOpen(true)}
          />
        ) : null}
      </div>
      {createPortal(
        <DragOverlay dropAnimation={null}>
          {draggedTodo && (
            <div className="theme-card flex min-h-11 w-[min(42rem,calc(100vw-2rem))] items-center gap-3 rounded-sm border border-brand/40 bg-raised px-3 text-body shadow-pop">
              <span className="shrink-0 font-mono text-key text-muted">{draggedTodo.key}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{draggedTodo.title}</span>
            </div>
          )}
        </DragOverlay>,
        document.body,
      )}
      </DndContext>

      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        sprints={sprints}
        isProcessing={bulk.isProcessing}
        error={bulk.error}
        onClear={bulk.clear}
        onMoveToSprint={bulk.bulkMoveToSprint}
        onChangePriority={bulk.bulkChangePriority}
        onDelete={bulk.bulkDelete}
      />

      <LabelManagementDialog
        open={manageLabelsOpen}
        projectId={projectId}
        allLabels={availableLabels}
        onOpenChange={setManageLabelsOpen}
      />

      <SprintTemplateDialog
        open={sprintTemplateOpen}
        projectId={projectId}
        onOpenChange={setSprintTemplateOpen}
      />

      <TodoDetailsDialog todoId={selectedTodoId} onOpenChange={(open) => !open && setSelectedTodoId(null)} />
      <SprintFormDialog open={createSprintOpen} projectId={projectId} onOpenChange={setCreateSprintOpen} />
      <GenerateTodosDialog open={generateOpen} projectId={projectId} onOpenChange={setGenerateOpen} />
      <PlanSprintDialog open={planOpen} projectId={projectId} onOpenChange={setPlanOpen} />
      <Modal
        open={Boolean(deletingTodo)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTodo(undefined)
            setDeleteError('')
          }
        }}
        title={`Delete “${deletingTodo?.key ?? 'todo'}”?`}
        description="This permanently deletes this todo."
        size="confirm"
      >
        <div className="grid gap-4">
          {deleteError && <p role="alert" className="text-small text-danger">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDeletingTodo(undefined)}>Cancel</Button>
            <Button variant="danger" loading={todoRemove.isPending} onClick={() => void deleteTodo()}>Delete todo</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

function SprintSectionSkeleton() {
  return (
    <div className="theme-card grid gap-3 border-s-2 border-s-info p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-7" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="ms-auto h-5 w-24 rounded-full" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

function BacklogLoadingSkeleton() {
  return (
    <section className="theme-card mt-5 overflow-hidden rounded-md border-s-2 border-s-brand" role="status" aria-label="Loading backlog">
      <div className="flex min-h-12 items-center gap-2 border-b border-line bg-brand-soft/50 px-3">
        <Skeleton className="size-4" />
        <Skeleton className="size-7 rounded-sm" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>
      <div className="grid gap-1 py-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex min-h-11 items-center gap-3 px-3">
            <Skeleton className="size-6" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
            <Skeleton className="size-6 rounded-full" />
          </div>
        ))}
      </div>
      <div className="border-t border-dashed border-line-strong px-3 py-3">
        <Skeleton className="h-8 w-full" />
      </div>
    </section>
  )
}
