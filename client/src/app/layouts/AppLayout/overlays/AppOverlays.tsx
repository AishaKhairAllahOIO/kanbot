import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { getErrorMessage } from '@/shared/api/errors'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { Modal } from '@/shared/components/Modal'
import { Skeleton } from '@/shared/components/Skeleton'
import { useLocalStorageState } from '@/shared/hooks/useLocalStorageState'
import { useTheme } from '@/app/providers/theme'
import { useToast } from '@/app/providers/toast'
import { useCurrentProject } from '../shared/hooks/useCurrentProject'
import { useLayoutStore } from '../store/layoutStore'
import { AssistantHost } from '../shared/topbar/components/AssistantHost'
import { CommandPalette } from '@/app/shortcuts/CommandPalette'
import { ShortcutsHelpDialog } from '@/app/shortcuts/ShortcutsHelpDialog'
import { createShortcutRegistry } from '@/app/shortcuts/shortcuts.registry'
import type { ShortcutItem } from '@/app/shortcuts/shortcuts.registry'
import { useAppHotkeys } from '@/app/shortcuts/useAppHotkeys'
import { useSummarizeSprint } from '@/features/ai/hooks/useSummarizeSprint'
import { buildDailyStandupPrompt } from '@/features/ai/utils/dailyStandup'
import { useSprints } from '@/features/sprints/hooks/useSprints'
import { useSprintBoard } from '@/features/sprints/hooks/useSprintBoard'
import { useTodos } from '@/features/todos/hooks/useTodos'
import type { ProjectWithStats } from '@/shared/types/api'

const SprintFormDialog = lazy(() =>
  import('@/features/sprints/components/SprintFormDialog').then((module) => ({ default: module.SprintFormDialog })),
)
const StartSprintDialog = lazy(() =>
  import('@/features/sprints/components/StartSprintDialog').then((module) => ({ default: module.StartSprintDialog })),
)
const CompleteSprintDialog = lazy(() =>
  import('@/features/board/components/CompleteSprintDialog').then((module) => ({ default: module.CompleteSprintDialog })),
)
const TodoDetailsDialog = lazy(() =>
  import('@/features/todos/components/TodoDetailsDialog').then((module) => ({ default: module.TodoDetailsDialog })),
)
const GenerateTodosDialog = lazy(() =>
  import('@/features/ai/components/GenerateTodosDialog').then((module) => ({ default: module.GenerateTodosDialog })),
)
const PlanSprintDialog = lazy(() =>
  import('@/features/ai/components/PlanSprintDialog').then((module) => ({ default: module.PlanSprintDialog })),
)

export function AppOverlays() {
  const { projectId } = useParams()
  const { project, projects, projectsLoading, projectsError, retryProjects } = useCurrentProject()
  const location = useLocation()
  const navigate = useNavigate()
  const { toggleTheme } = useTheme()
  const isAssistantOpen = useLayoutStore((state) => state.isAssistantOpen)
  const setAssistantOpen = useLayoutStore((state) => state.setAssistantOpen)
  const pendingAssistantPrompt = useLayoutStore((state) => state.pendingAssistantPrompt)
  const consumeAssistantPrompt = useLayoutStore((state) => state.consumeAssistantPrompt)
  const isPaletteOpen = useLayoutStore((state) => state.isPaletteOpen)
  const setPaletteOpen = useLayoutStore((state) => state.setPaletteOpen)
  const isShortcutsOpen = useLayoutStore((state) => state.isShortcutsOpen)
  const setShortcutsOpen = useLayoutStore((state) => state.setShortcutsOpen)
  const [recentIds, setRecentIds] = useLocalStorageState<string[]>('kanbot:command-recent', [])
  const [createSprintOpen, setCreateSprintOpen] = useState(false)
  const [startSprintOpen, setStartSprintOpen] = useState(false)
  const [completeSprintOpen, setCompleteSprintOpen] = useState(false)
  const [generateTodosOpen, setGenerateTodosOpen] = useState(false)
  const [planSprintOpen, setPlanSprintOpen] = useState(false)
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const activeSprintId = project?.stats.activeSprint?.id ?? null
  const { mutate: summarize } = useSummarizeSprint()
  const showToast = useToast()

  const onCreateTodos = useCallback(() => {
    setAssistantOpen(false)
    setGenerateTodosOpen(true)
  }, [setAssistantOpen])
  const onPlanSprint = useCallback(() => {
    setAssistantOpen(false)
    setPlanSprintOpen(true)
  }, [setAssistantOpen])
  const navigateProjectPage = useCallback((page: 'backlog' | 'board' | 'sprints') => {
    if (projectId) navigate(`/projects/${projectId}/${page}`)
  }, [navigate, projectId])
  const createTodo = useCallback(() => {
    if (!projectId) return
    if (location.pathname.endsWith('/backlog')) {
      document.querySelector<HTMLElement>('[data-shortcut-create]')?.focus()
      return
    }
    navigate(`/projects/${projectId}/backlog`, { state: { shortcutFocusTodo: true } })
  }, [location.pathname, navigate, projectId])
  const focusSearch = useCallback(() => {
    document.querySelector<HTMLElement>('[data-shortcut-search]')?.focus()
  }, [])
  const summarizeActiveSprint = useCallback(() => {
    if (!activeSprintId) return
    summarize(activeSprintId, {
      onError: (error) => showToast(getErrorMessage(error), 'error'),
    })
  }, [activeSprintId, showToast, summarize])
  const registry = useMemo(
    () => createShortcutRegistry(
      {
        togglePalette: () => setPaletteOpen(!isPaletteOpen),
        openHelp: () => setShortcutsOpen(true),
        createTodo,
        focusSearch,
        goToBoard: () => navigateProjectPage('board'),
        goToBacklog: () => navigateProjectPage('backlog'),
        goToSprints: () => navigateProjectPage('sprints'),
        openProjects: () => navigate('/projects'),
        createSprint: () => setCreateSprintOpen(true),
        startSprint: () => setStartSprintOpen(true),
        completeSprint: () => setCompleteSprintOpen(true),
        toggleTheme,
        openAssistant: () => setAssistantOpen(true),
        generateTodos: () => setGenerateTodosOpen(true),
        planSprint: () => setPlanSprintOpen(true),
        summarizeSprint: () => {
          if (!activeSprintId) return
          summarizeActiveSprint()
          navigateProjectPage('board')
        },
      },
      {
        hasProject: Boolean(projectId),
        hasPlannedSprint: Boolean(projectId),
        hasActiveSprint: Boolean(activeSprintId),
      },
    ),
    [
      activeSprintId,
      createTodo,
      focusSearch,
      isPaletteOpen,
      navigate,
      navigateProjectPage,
      projectId,
      summarizeActiveSprint,
      setAssistantOpen,
      setPaletteOpen,
      setShortcutsOpen,
      toggleTheme,
    ],
  )
  useAppHotkeys(registry)

  const selectPaletteItem = useCallback((id: string) => {
    setRecentIds((current) => [id, ...current.filter((recentId) => recentId !== id)].slice(0, 5))
    if (id.startsWith('project:')) {
      navigate(`/projects/${id.slice('project:'.length)}/backlog`)
    } else if (id.startsWith('todo:')) {
      setSelectedTodoId(id.slice('todo:'.length))
    } else {
      registry.find((item) => item.id === id)?.run()
    }
  }, [navigate, registry, setRecentIds])

  return (
    <>
      {isPaletteOpen && projectId ? (
        <ProjectCommandPalette
          open
          onOpenChange={setPaletteOpen}
          registry={registry}
          projects={projects}
          projectId={projectId}
          recentIds={recentIds}
          onSelect={selectPaletteItem}
          projectsLoading={projectsLoading}
          projectsError={projectsError ? 'Projects could not be loaded.' : undefined}
          onRetryProjects={() => void retryProjects()}
        />
      ) : (
        <CommandPalette
          open={isPaletteOpen}
          onOpenChange={setPaletteOpen}
          registry={registry}
          projects={projects}
          todos={[]}
          recentIds={recentIds}
          onSelect={selectPaletteItem}
          dataLoading={projectsLoading}
          dataError={projectsError ? 'Projects could not be loaded.' : undefined}
          onRetryData={() => void retryProjects()}
        />
      )}
      <ShortcutsHelpDialog
        open={isShortcutsOpen}
        onOpenChange={setShortcutsOpen}
        registry={registry}
      />
      <Suspense fallback={<DialogLoadingSkeleton />}>
        {projectId && createSprintOpen && (
          <SprintFormDialog open projectId={projectId} onOpenChange={setCreateSprintOpen} />
        )}
        {projectId && startSprintOpen && (
          <StartSprintAction
            projectId={projectId}
            onOpenChange={setStartSprintOpen}
          />
        )}
        {projectId && completeSprintOpen && activeSprintId && (
          <CompleteSprintAction
            projectId={projectId}
            activeSprintId={activeSprintId}
            onOpenChange={setCompleteSprintOpen}
          />
        )}
        {projectId && generateTodosOpen && (
          <GenerateTodosDialog open projectId={projectId} onOpenChange={setGenerateTodosOpen} />
        )}
        {projectId && planSprintOpen && (
          <PlanSprintDialog open projectId={projectId} onOpenChange={setPlanSprintOpen} />
        )}
        {selectedTodoId && (
          <TodoDetailsDialog todoId={selectedTodoId} onOpenChange={(open) => !open && setSelectedTodoId(null)} />
        )}
      </Suspense>
      {projectId && (isAssistantOpen || pendingAssistantPrompt) && (
        <AssistantOverlay
          open={isAssistantOpen}
          pendingPrompt={pendingAssistantPrompt}
          onPromptSent={consumeAssistantPrompt}
          projectId={projectId}
          activeSprintId={activeSprintId}
          onOpenChange={setAssistantOpen}
          onCreateTodos={onCreateTodos}
          onPlanSprint={onPlanSprint}
          onSummarize={() => {
            summarizeActiveSprint()
            setAssistantOpen(false)
          }}
        />
      )}
    </>
  )
}

function ProjectCommandPalette({
  open,
  onOpenChange,
  registry,
  projects,
  projectId,
  recentIds,
  onSelect,
  projectsLoading,
  projectsError,
  onRetryProjects,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  registry: ShortcutItem[]
  projects: ProjectWithStats[]
  projectId: string
  recentIds: string[]
  onSelect: (id: string) => void
  projectsLoading: boolean
  projectsError?: string
  onRetryProjects: () => void
}) {
  const todosQuery = useTodos(projectId)
  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      registry={registry}
      projects={projects}
      todos={(todosQuery.data?.todos ?? []).map(({ id, key, title }) => ({ id, key, title }))}
      recentIds={recentIds}
      onSelect={onSelect}
      dataLoading={projectsLoading || todosQuery.isPending}
      dataError={projectsError ?? (todosQuery.isError ? getErrorMessage(todosQuery.error) : undefined)}
      onRetryData={() => {
        onRetryProjects()
        void todosQuery.refetch()
      }}
    />
  )
}

function AssistantOverlay({
  open,
  pendingPrompt,
  onPromptSent,
  projectId,
  activeSprintId,
  onOpenChange,
  onCreateTodos,
  onPlanSprint,
  onSummarize,
}: {
  open: boolean
  pendingPrompt: ReturnType<typeof useLayoutStore.getState>['pendingAssistantPrompt']
  onPromptSent: (id: number) => void
  projectId: string
  activeSprintId: string | null
  onOpenChange: (open: boolean) => void
  onCreateTodos: () => void
  onPlanSprint: () => void
  onSummarize: () => void
}) {
  const todosQuery = useTodos(projectId)
  const dailyStandupPrompt = buildDailyStandupPrompt(todosQuery.data?.todos ?? [], activeSprintId)

  return (
    <AssistantHost
      open={open}
      pendingPrompt={pendingPrompt}
      onPromptSent={onPromptSent}
      projectId={projectId}
      activeSprintId={activeSprintId}
      dailyStandupPrompt={dailyStandupPrompt}
      dailyStandupDisabled={todosQuery.isPending || todosQuery.isError}
      dailyStandupError={todosQuery.isError ? getErrorMessage(todosQuery.error) : undefined}
      onRetryDailyStandup={() => void todosQuery.refetch()}
      onOpenChange={onOpenChange}
      onCreateTodos={onCreateTodos}
      onPlanSprint={onPlanSprint}
      onSummarize={onSummarize}
    />
  )
}

function StartSprintAction({
  projectId,
  onOpenChange,
}: {
  projectId: string
  onOpenChange: (open: boolean) => void
}) {
  const sprintsQuery = useSprints(projectId)
  const plannedSprint = sprintsQuery.data?.sprints.find((sprint) => sprint.status === 'planned')

  return (
    <Suspense fallback={<DialogLoadingSkeleton />}>
      {sprintsQuery.isPending && (
        <DialogQueryLoading title="Loading sprint options" onClose={() => onOpenChange(false)} />
      )}
      {!sprintsQuery.isPending && !sprintsQuery.isError && !plannedSprint && (
        <NoPlannedSprint onOpenChange={onOpenChange} />
      )}
      {plannedSprint && <StartSprintDialog open sprint={plannedSprint} onOpenChange={onOpenChange} />}
      {sprintsQuery.isError && (
        <SprintLoadError
          message={getErrorMessage(sprintsQuery.error)}
          onRetry={() => void sprintsQuery.refetch()}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Suspense>
  )
}

function NoPlannedSprint({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title="Start sprint"
      size="confirm"
    >
      <div className="grid gap-4">
        <EmptyState
          title="No sprint is ready to start"
          description="Create a planned sprint before starting one."
        />
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}

function CompleteSprintAction({
  projectId,
  activeSprintId,
  onOpenChange,
}: {
  projectId: string
  activeSprintId: string
  onOpenChange: (open: boolean) => void
}) {
  const sprintsQuery = useSprints(projectId)
  const boardQuery = useSprintBoard(activeSprintId)
  const sprints = sprintsQuery.data?.sprints ?? []
  const sprint = sprints.find((item) => item.id === activeSprintId)
  const plannedSprints = sprints.filter((item) => item.status === 'planned')

  return (
    <Suspense fallback={<DialogLoadingSkeleton />}>
      {(sprintsQuery.isPending || boardQuery.isPending) && (
        <DialogQueryLoading title="Loading sprint details" onClose={() => onOpenChange(false)} />
      )}
      {sprint && boardQuery.data && (
        <CompleteSprintDialog
          open
          sprint={sprint}
          board={boardQuery.data}
          plannedSprints={plannedSprints}
          onOpenChange={onOpenChange}
        />
      )}
      {(sprintsQuery.isError || boardQuery.isError || (!sprintsQuery.isPending && !sprint)) && (
        <SprintLoadError
          message={getErrorMessage(sprintsQuery.error ?? boardQuery.error ?? new Error('Active sprint could not be loaded.'))}
          onRetry={() => {
            void sprintsQuery.refetch()
            void boardQuery.refetch()
          }}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Suspense>
  )
}

function SprintLoadError({
  message,
  onRetry,
  onClose,
}: {
  message: string
  onRetry: () => void
  onClose: () => void
}) {
  return (
    <Modal open onOpenChange={(open) => !open && onClose()} title="Sprint could not be loaded" size="confirm">
      <div className="grid gap-4">
        <EmptyState
          title="Sprint could not be loaded"
          description={message}
          error
          action={<Button onClick={onRetry}>Try again</Button>}
        />
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}

function DialogQueryLoading({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <Modal open onOpenChange={(open) => !open && onClose()} title={title} size="confirm">
      <div className="grid gap-3" role="status" aria-label={title}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="ms-auto h-9 w-24" />
      </div>
    </Modal>
  )
}

function DialogLoadingSkeleton() {
  return (
    <div className="fixed inset-0 z-dialog grid place-content-center bg-overlay p-4" role="status" aria-label="Loading dialog">
      <div className="theme-card grid w-[min(32rem,calc(100vw-2rem))] gap-4 p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="ms-auto h-9 w-24" />
      </div>
    </div>
  )
}
