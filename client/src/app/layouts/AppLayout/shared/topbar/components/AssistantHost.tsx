import { lazy, Suspense } from 'react'
import { Skeleton } from '@/shared/components/Skeleton'
import type { AssistantPrompt } from '../../../store/layoutStore'

const AssistantDrawer = lazy(() =>
  import('@/features/ai/components/AssistantDrawer').then((module) => ({ default: module.AssistantDrawer })),
)
interface AssistantHostProps {
  open: boolean
  pendingPrompt: AssistantPrompt | null
  onPromptSent: (id: number) => void
  projectId: string | undefined
  activeSprintId: string | null
  dailyStandupPrompt: string
  dailyStandupDisabled: boolean
  dailyStandupError?: string
  onRetryDailyStandup: () => void
  onOpenChange: (open: boolean) => void
  onCreateTodos: () => void
  onPlanSprint: () => void
  onSummarize: () => void
}

export function AssistantHost({
  open,
  pendingPrompt,
  onPromptSent,
  projectId,
  activeSprintId,
  dailyStandupPrompt,
  dailyStandupDisabled,
  dailyStandupError,
  onRetryDailyStandup,
  onOpenChange,
  onCreateTodos,
  onPlanSprint,
  onSummarize,
}: AssistantHostProps) {
  if (!open && !pendingPrompt) return null
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-drawer grid place-content-center bg-canvas/70 p-4" role="status" aria-label="Loading AI tools">
          <div className="theme-card grid w-[min(32rem,calc(100vw-2rem))] gap-4 p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      }
    >
      <AssistantDrawer
        key={projectId ?? 'no-project'}
        open={open}
        projectId={projectId ?? null}
        activeSprintId={activeSprintId}
        onOpenChange={onOpenChange}
        pendingPrompt={pendingPrompt}
        onPromptSent={onPromptSent}
        dailyStandupPrompt={dailyStandupPrompt}
        dailyStandupDisabled={dailyStandupDisabled}
        dailyStandupError={dailyStandupError}
        onRetryDailyStandup={onRetryDailyStandup}
        onCreateTodos={onCreateTodos}
        onPlanSprint={onPlanSprint}
        onSummarize={onSummarize}
      />
    </Suspense>
  )
}
