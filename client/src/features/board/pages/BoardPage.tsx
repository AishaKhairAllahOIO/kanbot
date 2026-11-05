import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router'
import { ApiError, getErrorMessage } from '../../../shared/api/errors'
import { useProject } from '../../projects/hooks/useProjects'
import { useSprintBoard } from '../../sprints/hooks/useSprintBoard'
import { useSprints } from '@/features/sprints/hooks/useSprints'
import { TODO_STATUSES, type Todo, type TodoStatus } from '../../../shared/types/api'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Modal } from '../../../shared/components/Modal'
import { Skeleton } from '../../../shared/components/Skeleton'
import { BoardColumn } from '../components/BoardColumn'
import { BoardProgress } from '../components/BoardProgress'
import { BoardSprintHeader } from '../components/BoardSprintHeader'
import { BurndownChart } from '../components/BurndownChart'
import { CompleteSprintDialog } from '../components/CompleteSprintDialog'
import { MobileColumnTabs } from '../components/MobileColumnTabs'
import { TodoCardPreview } from '../components/TodoCard'
import { useTodoMutations } from '../../todos/hooks/useTodos'
import { TodoDetailsDialog } from '../../todos/components/TodoDetailsDialog'
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle'
import { Topbar } from '@/app/layouts'
import '../components/board.css'

const statusLabels: Record<TodoStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

const emptyBoardColumns: Record<TodoStatus, Todo[]> = {
  todo: [],
  in_progress: [],
  in_review: [],
  done: [],
}

function readableStatus(status: string) {
  const knownStatus = TODO_STATUSES.find((candidate) => candidate === status)
  return knownStatus ? statusLabels[knownStatus] : status
}

export function BoardPage() {
  useDocumentTitle('Active Sprint')
  const { projectId = '' } = useParams()
  const projectQuery = useProject(projectId)
  const project = projectQuery.data?.project
  const activeSprintId = project?.stats.activeSprint?.id
  const boardQuery = useSprintBoard(activeSprintId)
  const sprintsQuery = useSprints(projectId)
  const todoMutations = useTodoMutations(projectId)

  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const [showBurndown, setShowBurndown] = useState(false)
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TodoStatus>>(() => new Set())
  const [emptyBoardCollapsedColumns, setEmptyBoardCollapsedColumns] =
    useState<Set<TodoStatus> | null>(null)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [deletingTodo, setDeletingTodo] = useState<Todo>()
  const [deleteError, setDeleteError] = useState('')
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [draggedCardHeight, setDraggedCardHeight] = useState<number>()
  const [doneFlashTodoId, setDoneFlashTodoId] = useState<string | null>(null)
  const boardScrollRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 47.999rem)').matches,
  )
  const [edgeZone, setEdgeZone] = useState<'start' | 'end' | null>(null)
  const edgeDirectionRef = useRef<'start' | 'end' | null>(null)
  const edgeTimeoutRef = useRef<number | null>(null)
  const edgeIntervalRef = useRef<number | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const doneFlashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const board = boardQuery.data
  const sprint = board?.sprint
  const allTodos = board ? TODO_STATUSES.flatMap((status) => board.columns[status]) : []
  const activeTodo = allTodos.find((todo) => todo.id === activeTodoId) ?? null
  const overTodo = allTodos.find((todo) => todo.id === overId)
  const overStatus = overTodo?.status ?? (
    overId?.startsWith('column:') ? (overId.slice('column:'.length) as TodoStatus) : null
  )
  const sprints = sprintsQuery.data?.sprints ?? []
  const plannedSprints = sprints.filter((s) => s.status === 'planned')
  const collapsedColumnCount = isMobile
    ? 0
    : TODO_STATUSES.filter((status) => collapsedColumns.has(status)).length
  const expandedColumnCount = TODO_STATUSES.length - collapsedColumnCount
  const boardGridStyle = {
    gridTemplateColumns: isMobile
      ? 'repeat(4, 100%)'
      : TODO_STATUSES.map((status) =>
          collapsedColumns.has(status) ? '3.5rem' : 'minmax(var(--board-column-min), 1fr)',
        ).join(' '),
    minWidth: isMobile
      ? undefined
      : `calc(var(--board-column-min) * ${expandedColumnCount} + 3.5rem * ${collapsedColumnCount} + 2.25rem)`,
    transition: 'grid-template-columns var(--dur-base) var(--ease)',
  }
  const collisionDetection: CollisionDetection = (args) => {
    if (!isMobile || !args.pointerCoordinates) return closestCenter(args)

    const pointerCollisions = pointerWithin(args)
    const cardCollisions = pointerCollisions.filter(
      (collision) => !String(collision.id).startsWith('column:'),
    )
    if (cardCollisions.length > 0) return cardCollisions

    const columnCollision = pointerCollisions.find((collision) =>
      String(collision.id).startsWith('column:'),
    )
    if (columnCollision) {
      const status = String(columnCollision.id).slice('column:'.length) as TodoStatus
      const columnTodoIds = new Set(board?.columns[status].map((todo) => todo.id) ?? [])
      if (columnTodoIds.size > 0) {
        const columnCards = closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) =>
            columnTodoIds.has(String(container.id)),
          ),
        })
        if (columnCards.length > 0) return columnCards
      }
      return [columnCollision]
    }

    return pointerCollisions
  }
  const pageHeader = <Topbar title="Active Sprint" />
  const renderPage = (content: ReactNode) => (
    <>
      {pageHeader}
      <main className="px-6 py-6 pb-8">{content}</main>
    </>
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 47.999rem)')
    const updateViewport = () => setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateViewport)
    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  useEffect(() => {
    if (!activeTodoId || !isMobile) return

    const previousOverscrollBehavior = document.documentElement.style.overscrollBehavior
    const previousBodyOverscrollBehavior = document.body.style.overscrollBehavior
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehavior = 'none'
    const preventTouchScroll = (event: TouchEvent) => event.preventDefault()
    document.addEventListener('touchmove', preventTouchScroll, { passive: false })
    return () => {
      document.documentElement.style.overscrollBehavior = previousOverscrollBehavior
      document.body.style.overscrollBehavior = previousBodyOverscrollBehavior
      document.removeEventListener('touchmove', preventTouchScroll)
    }
  }, [activeTodoId, isMobile])

  useEffect(
    () => () => {
      if (doneFlashTimeout.current) clearTimeout(doneFlashTimeout.current)
      if (edgeTimeoutRef.current !== null) clearTimeout(edgeTimeoutRef.current)
      if (edgeIntervalRef.current !== null) clearInterval(edgeIntervalRef.current)
    },
    [],
  )

  function moveTodoToPosition(todoId: string, status: TodoStatus, position: number) {
    todoMutations.move.mutate({ todoId, body: { status, position } })
  }

  function toggleColumnCollapsed(status: TodoStatus) {
    if (!activeSprintId) {
      setEmptyBoardCollapsedColumns((current) => {
        const next = new Set(current ?? TODO_STATUSES)
        if (next.has(status)) next.delete(status)
        else next.add(status)
        return next
      })
      return
    }

    setCollapsedColumns((current) => {
      const next = new Set(current)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  function moveToStatus(todoId: string, status: TodoStatus) {
    const position = board?.columns[status].filter((todo) => todo.id !== todoId).length ?? 0
    moveTodoToPosition(todoId, status, position)
  }

  function scrollToAdjacentColumn(direction: 'start' | 'end') {
    const container = boardScrollRef.current
    if (!container) return

    const rtl = window.getComputedStyle(container).direction === 'rtl'
    const goesRight = (direction === 'start') === rtl
    const columns = Array.from(container.querySelectorAll<HTMLElement>('[data-board-status]'))
    if (columns.length < 2) return

    const containerCenter = container.getBoundingClientRect().left + container.clientWidth / 2
    const currentColumn = columns.reduce((closest, column) => {
      const center = column.getBoundingClientRect().left + column.offsetWidth / 2
      const closestCenter = closest.getBoundingClientRect().left + closest.offsetWidth / 2
      return Math.abs(center - containerCenter) < Math.abs(closestCenter - containerCenter)
        ? column
        : closest
    })
    const currentCenter = currentColumn.getBoundingClientRect().left + currentColumn.offsetWidth / 2
    const neighbors = columns
      .map((column) => ({
        column,
        center: column.getBoundingClientRect().left + column.offsetWidth / 2,
      }))
      .filter(({ center }) => (goesRight ? center > currentCenter : center < currentCenter))
      .sort((a, b) => (goesRight ? a.center - b.center : b.center - a.center))

    neighbors[0]?.column.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  function stopEdgeScrolling() {
    edgeDirectionRef.current = null
    if (edgeTimeoutRef.current !== null) {
      clearTimeout(edgeTimeoutRef.current)
      edgeTimeoutRef.current = null
    }
    if (edgeIntervalRef.current !== null) {
      clearInterval(edgeIntervalRef.current)
      edgeIntervalRef.current = null
    }
    setEdgeZone(null)
  }

  function handleDragMove(event: DragMoveEvent) {
    if (!isMobile) return

    const activator = event.activatorEvent
    let pointerX: number | undefined
    if ('changedTouches' in activator) {
      const touchEvent = activator as TouchEvent
      const touch = touchEvent.changedTouches[0] ?? touchEvent.touches[0]
      pointerX = touch ? touch.clientX + event.delta.x : undefined
    } else if ('clientX' in activator) {
      pointerX = (activator as MouseEvent).clientX + event.delta.x
    }
    if (pointerX === undefined) {
      const rect = event.active.rect.current.translated
      pointerX = rect ? rect.left + rect.width / 2 : undefined
    }
    if (pointerX === undefined) return

    const rtl = window.getComputedStyle(boardScrollRef.current ?? document.documentElement).direction === 'rtl'
    const nextDirection =
      pointerX <= window.innerWidth * 0.15
        ? (rtl ? 'end' : 'start')
        : pointerX >= window.innerWidth * 0.85
          ? (rtl ? 'start' : 'end')
          : null

    if (nextDirection === edgeDirectionRef.current) return
    stopEdgeScrolling()
    if (!nextDirection) return

    edgeDirectionRef.current = nextDirection
    setEdgeZone(nextDirection)
    edgeTimeoutRef.current = window.setTimeout(() => {
      scrollToAdjacentColumn(nextDirection)
      edgeIntervalRef.current = window.setInterval(
        () => scrollToAdjacentColumn(nextDirection),
        600,
      )
      edgeTimeoutRef.current = null
    }, 400)
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTodoId(String(event.active.id))
    setDraggedCardHeight(event.active.rect.current.initial?.height)
    if (isMobile && typeof navigator.vibrate === 'function') navigator.vibrate(10)
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over ? String(event.over.id) : null)
  }

  function clearDragState() {
    stopEdgeScrolling()
    setActiveTodoId(null)
    setOverId(null)
    setDraggedCardHeight(undefined)
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!board || !event.over || event.active.id === event.over.id) return
    const activeTodo = allTodos.find((t) => t.id === event.active.id)
    if (!activeTodo) return
    const overId = String(event.over.id)
    const overTodo = allTodos.find((t) => t.id === overId)
    const targetStatus =
      overTodo?.status ??
      (overId.startsWith('column:')
        ? (overId.slice('column:'.length) as TodoStatus)
        : activeTodo.status)
    const targetList = board.columns[targetStatus].filter((t) => t.id !== activeTodo.id)
    const overIndex = overTodo ? targetList.findIndex((t) => t.id === overTodo.id) : -1
    const activeRect = event.active.rect.current.translated
    const position = overIndex < 0
      ? targetList.length
      : overIndex +
        (activeRect && event.over.rect
          ? activeRect.top + activeRect.height / 2 >
            event.over.rect.top + event.over.rect.height / 2
            ? 1
            : 0
          : 0)
    moveTodoToPosition(activeTodo.id, targetStatus, position)
  }

  function finishDrag(event: DragEndEvent) {
    const draggedTodo = allTodos.find((todo) => todo.id === event.active.id)
    const droppedOver = event.over ? String(event.over.id) : null
    const targetTodo = droppedOver ? allTodos.find((todo) => todo.id === droppedOver) : undefined
    const targetStatus =
      targetTodo?.status ??
      (droppedOver?.startsWith('column:')
        ? (droppedOver.slice('column:'.length) as TodoStatus)
        : null)

    if (draggedTodo && event.over && event.active.id !== event.over.id && targetStatus === 'done') {
      if (doneFlashTimeout.current) clearTimeout(doneFlashTimeout.current)
      setDoneFlashTodoId(draggedTodo.id)
      doneFlashTimeout.current = setTimeout(() => {
        setDoneFlashTodoId(null)
        doneFlashTimeout.current = null
      }, 600)
    }

    handleDragEnd(event)
    requestAnimationFrame(() => {
      clearDragState()
      if (isMobile && targetStatus) {
        boardScrollRef.current
          ?.querySelector<HTMLElement>(`[data-board-status="${targetStatus}"]`)
          ?.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'start',
          })
      }
    })
  }

  async function deleteTodo() {
    if (!deletingTodo) return
    setDeleteError('')
    try {
      await todoMutations.remove.mutateAsync(deletingTodo.id)
      setDeletingTodo(undefined)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        setDeletingTodo(undefined)
        return
      }
      setDeleteError(getErrorMessage(error))
    }
  }

  if (projectQuery.isPending) {
    return renderPage(
      <BoardLoadingSkeleton />,
    )
  }
  if (projectQuery.isError || !project) {
    return renderPage(
      <EmptyState
        title="Project could not be loaded"
        description={getErrorMessage(projectQuery.error)}
        error
        action={<Button onClick={() => void projectQuery.refetch()}>Try again</Button>}
      />,
    )
  }
  if (!activeSprintId) {
    const emptyBoardCollapsed =
      emptyBoardCollapsedColumns ?? new Set<TodoStatus>(TODO_STATUSES)
    const emptyCollapsedColumnCount = isMobile
      ? 0
      : TODO_STATUSES.filter((status) => emptyBoardCollapsed.has(status)).length
    const emptyExpandedColumnCount = TODO_STATUSES.length - emptyCollapsedColumnCount
    const emptyBoardGridStyle = {
      gridTemplateColumns: isMobile
        ? 'repeat(4, 100%)'
        : TODO_STATUSES.map((status) =>
            emptyBoardCollapsed.has(status) ? '3.5rem' : 'minmax(var(--board-column-min), 1fr)',
          ).join(' '),
      minWidth: isMobile
        ? undefined
        : `calc(var(--board-column-min) * ${emptyExpandedColumnCount} + 3.5rem * ${emptyCollapsedColumnCount} + 2.25rem)`,
      transition: 'grid-template-columns var(--dur-base) var(--ease)',
    }

    return renderPage(
      <section className="flex flex-col gap-5">
        <div className="theme-card rounded-lg border-s-2 border-s-brand">
          <EmptyState
            title="No active sprint"
            description="Plan a sprint from your backlog, then start it to see it here."
            action={
              <Link
                to={`/projects/${projectId}/backlog`}
                className="inline-flex min-h-9 items-center rounded-sm bg-brand px-4 text-small font-medium text-on-brand"
              >
                Go to backlog
              </Link>
            }
          />
        </div>

        <MobileColumnTabs columns={emptyBoardColumns} scrollContainerRef={boardScrollRef} />
        <div
          ref={boardScrollRef}
          className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-4 touch-auto snap-x snap-mandatory"
        >
          <DndContext sensors={sensors} collisionDetection={collisionDetection}>
            <div className="grid min-w-0 items-start gap-3" style={emptyBoardGridStyle}>
              {TODO_STATUSES.map((status) => (
                <BoardColumn
                  key={status}
                  status={status}
                  collapsed={!isMobile && emptyBoardCollapsed.has(status)}
                  onToggleCollapsed={toggleColumnCollapsed}
                  todos={emptyBoardColumns[status]}
                  onOpen={setSelectedTodoId}
                  onMove={moveToStatus}
                  onDelete={setDeletingTodo}
                  activeTodoId={null}
                  enableCardTouchDrag={false}
                  overTodoId={null}
                  showDropPlaceholder={false}
                  doneFlashTodoId={null}
                />
              ))}
            </div>
          </DndContext>
        </div>
      </section>,
    )
  }
  if (boardQuery.isPending) {
    return renderPage(
      <BoardLoadingSkeleton />,
    )
  }
  if (boardQuery.isError || !board || !sprint) {
    return renderPage(
      <EmptyState
        title="Sprint board could not be loaded"
        description={getErrorMessage(boardQuery.error)}
        error
        action={<Button onClick={() => void boardQuery.refetch()}>Try again</Button>}
      />,
    )
  }

  return renderPage(
    <section className="flex flex-col gap-5">
     
      <BoardSprintHeader
        sprint={sprint}
        showBurndown={showBurndown}
        onToggleBurndown={() => setShowBurndown((prev) => !prev)}
        onComplete={() => setCompleteOpen(true)}
      />



      {showBurndown && (
        <BurndownChart sprint={sprint} todos={allTodos} />
      )}

      <BoardProgress columns={board.columns} />

      {sprintsQuery.isError && (
        <EmptyState
          title="Sprint options could not be loaded"
          description={getErrorMessage(sprintsQuery.error)}
          error
          action={<Button onClick={() => void sprintsQuery.refetch()}>Try again</Button>}
        />
      )}
      {sprintsQuery.isPending && (
        <div role="status" aria-label="Loading sprint options">
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      <MobileColumnTabs columns={board.columns} scrollContainerRef={boardScrollRef} />
      <div
        ref={boardScrollRef}
        className={`w-full min-w-0 overflow-x-auto overscroll-x-contain pb-4 touch-auto snap-mandatory ${
          activeTodoId && isMobile ? 'snap-none touch-none' : 'snap-x'
        }`}
      >
        <DndContext
          sensors={sensors}
          autoScroll={!isMobile}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragMove={handleDragMove}
          onDragEnd={finishDrag}
          onDragCancel={clearDragState}
          accessibility={{
            announcements: {
              onDragStart: ({ active }) =>
                `Picked up ${allTodos.find((todo) => todo.id === active.id)?.key ?? active.id}.`,
              onDragOver: ({ active, over }) => {
                if (!over) return ''
                const todo = allTodos.find((item) => item.id === active.id)
                const target =
                  allTodos.find((item) => item.id === over.id)?.status ??
                  String(over.id).replace('column:', '')
                return `Moving ${todo?.key ?? active.id} to ${readableStatus(target)}.`
              },
              onDragEnd: ({ active, over }) => {
                if (!over) return ''
                const todo = allTodos.find((item) => item.id === active.id)
                const destination =
                  allTodos.find((item) => item.id === over.id)?.status ??
                  String(over.id).replace('column:', '')
                return `Dropped ${todo?.key ?? active.id} in ${readableStatus(destination)}.`
              },
              onDragCancel: ({ active }) =>
                `Cancelled moving ${allTodos.find((todo) => todo.id === active.id)?.key ?? active.id}.`,
            },
          }}
        >
          <div className="grid min-w-0 items-start gap-3" style={boardGridStyle}>
            {TODO_STATUSES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                collapsed={!isMobile && collapsedColumns.has(status)}
                onToggleCollapsed={toggleColumnCollapsed}
                todos={board.columns[status]}
                onOpen={setSelectedTodoId}
                onMove={moveToStatus}
                onDelete={setDeletingTodo}
                activeTodoId={activeTodoId}
                enableCardTouchDrag={isMobile}
                overTodoId={overTodo?.status === status ? overTodo.id : null}
                showDropPlaceholder={Boolean(activeTodo && overId && overStatus === status)}
                placeholderHeight={draggedCardHeight}
                doneFlashTodoId={doneFlashTodoId}
              />
            ))}
          </div>
          {createPortal(
            <DragOverlay
              zIndex={70}
              dropAnimation={null}
            >
              {activeTodo && <TodoCardPreview todo={activeTodo} className="board-drag-overlay" />}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      </div>
      {edgeZone && isMobile && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed inset-y-16 z-[69] block w-10 md:hidden ${
            edgeZone === 'start'
              ? 'start-0 bg-linear-to-r from-brand/15 to-transparent rtl:bg-linear-to-l'
              : 'end-0 bg-linear-to-l from-brand/15 to-transparent rtl:bg-linear-to-r'
          }`}
        />
      )}

      <TodoDetailsDialog
        todoId={selectedTodoId}
        onOpenChange={(open) => !open && setSelectedTodoId(null)}
      />
      <CompleteSprintDialog
        open={completeOpen}
        sprint={sprint}
        board={board}
        plannedSprints={plannedSprints}
        onOpenChange={setCompleteOpen}
      />
      <Modal
        open={Boolean(deletingTodo)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTodo(undefined)
            setDeleteError('')
          }
        }}
        title={`Delete "${deletingTodo?.key ?? 'todo'}"?`}
        description="This permanently deletes this todo."
        size="confirm"
      >
        <div className="grid gap-4">
          {deleteError && (
            <p role="alert" className="text-small text-danger">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDeletingTodo(undefined)}>Cancel</Button>
            <Button
              variant="danger"
              loading={todoMutations.remove.isPending}
              onClick={() => void deleteTodo()}
            >
              Delete todo
            </Button>
          </div>
        </div>
      </Modal>
    </section>,
  )
}

function BoardLoadingSkeleton() {
  return (
    <section className="grid gap-5" role="status" aria-label="Loading sprint board">
      <div className="theme-card grid gap-3 p-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="grid min-w-0 grid-cols-[repeat(4,100%)] items-start gap-3 md:min-w-[calc(var(--board-column-min)*4)] md:grid-cols-[repeat(4,minmax(var(--board-column-min),1fr))]">
        {Array.from({ length: 4 }, (_, column) => (
          <section key={column} className="grid content-start gap-3 rounded-lg border-t-[3px] border-line bg-sunken p-2">
            <div className="flex items-center gap-2 px-1 py-1">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-5 rounded-full" />
            </div>
            {Array.from({ length: column === 0 ? 2 : 1 }, (_, row) => (
              <article key={row} className="theme-card grid min-h-24 gap-3 p-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </article>
            ))}
          </section>
        ))}
      </div>
    </section>
  )
}
