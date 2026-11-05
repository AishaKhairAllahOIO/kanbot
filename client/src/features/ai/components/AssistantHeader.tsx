import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Sparkles, X } from 'lucide-react'
import { AssistantQuickActions } from './AssistantQuickActions'
import { Skeleton } from '../../../shared/components/Skeleton'

interface AssistantHeaderProps {
  mock: boolean
  statusLoading: boolean
  onNewChat: () => void
  onCreateTodos: () => void
  onPlanSprint: () => void
  onSummarize: () => void
  summarizeDisabled: boolean
  onDailyStandup: () => void
  dailyStandupDisabled: boolean
}

export function AssistantHeader({
  mock,
  statusLoading,
  onNewChat,
  onCreateTodos,
  onPlanSprint,
  onSummarize,
  summarizeDisabled,
  onDailyStandup,
  dailyStandupDisabled,
}: AssistantHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-content-center rounded-md bg-brand text-on-brand shadow-card">
          <Sparkles aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Dialog.Title className="font-heading text-heading font-semibold text-ink">
              Assistant
            </Dialog.Title>
            {mock && (
              <span className="rounded-xs border border-brand-soft-line bg-brand-soft px-1.5 py-0.5 text-caption text-brand-ink">
                Mock AI
              </span>
            )}
            {statusLoading && <Skeleton className="h-5 w-14 rounded-xs" />}
          </div>
          <Dialog.Description className="text-small text-muted">
            Your AI assistant
          </Dialog.Description>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <AssistantQuickActions
          onCreateTodos={onCreateTodos}
          onPlanSprint={onPlanSprint}
          onSummarize={onSummarize}
          summarizeDisabled={summarizeDisabled}
          onDailyStandup={onDailyStandup}
          dailyStandupDisabled={dailyStandupDisabled}
        />
        <button
          type="button"
          aria-label="New chat"
          onClick={onNewChat}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-line-strong bg-surface px-3 text-small font-medium text-ink transition-colors hover:bg-sunken active:bg-sunken"
        >
          <Plus aria-hidden="true" className="size-4" />
          <span>New chat</span>
        </button>
        <Dialog.Close asChild>
          <button
            type="button"
            aria-label="Close assistant"
            className="grid size-11 place-content-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </Dialog.Close>
      </div>
    </header>
  )
}
