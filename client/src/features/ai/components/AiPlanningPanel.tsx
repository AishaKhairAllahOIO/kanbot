import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Bot, CalendarDays, FileText, ListPlus, MessageCircle, Plus, X } from 'lucide-react'
import type { AiPlanningTab } from '@/app/layouts/AppLayout/store/layoutStore'
import { EmptyState } from '@/shared/components/EmptyState'
import { Field, SelectInput } from '@/shared/components/Field'
import { Tooltip } from '@/shared/components/Tooltip'
import type { Sprint } from '@/shared/types/api'
import { getErrorMessage } from '@/shared/api/errors'
import { useAiStatus } from '../hooks/useAiStatus'
import { AssistantChatContent } from './AssistantChatContent'
import { AiErrorState } from './AiErrorState'
import { GenerateTodosContent } from './GenerateTodosContent'
import { PlanSprintContent } from './PlanSprintContent'
import { SprintSummaryPanel } from './SprintSummaryPanel'

interface AiPlanningPanelProps {
  open: boolean
  projectId: string
  pageContext: 'backlog' | 'board' | 'other'
  pendingPrompt: {
    id: number
    projectId: string
    content: string
    todoReference?: { todoId: string; key: string }
  } | null
  sprints: Sprint[]
  summarySprint: Sprint | null
  tab: AiPlanningTab
  onTabChange: (tab: AiPlanningTab) => void
  onOpenChange: (open: boolean) => void
  onPromptSent: (id: number) => void
  onOpenTodo: (todoId: string) => void
  onViewBacklog: (todoIds?: string[], sprintId?: string) => void
  onViewSprint: (sprintId: string) => void
}

export function AiPlanningPanel({
  open,
  projectId,
  pageContext,
  pendingPrompt,
  sprints,
  summarySprint,
  tab,
  onTabChange,
  onOpenChange,
  onPromptSent,
  onOpenTodo,
  onViewBacklog,
  onViewSprint,
}: AiPlanningPanelProps) {
  const activeTab = tab
  const [visitedTabs, setVisitedTabs] = useState<Set<AiPlanningTab>>(() => new Set([activeTab]))
  const [summarySelection, setSummarySelection] = useState(() => {
    const sprintId = summarySprint?.id ?? ''
    return { sourceSprintId: sprintId, selectedSprintId: sprintId }
  })
  const summarySprintId =
    summarySelection.sourceSprintId === (summarySprint?.id ?? '')
      ? summarySelection.selectedSprintId
      : summarySprint?.id ?? ''
  const newChatActionRef = useRef<(() => void) | null>(null)
  const statusQuery = useAiStatus()
  const availableSummarySprints = sprints.filter((sprint) => sprint.status !== 'planned')
  const hasActiveSprint = sprints.some((sprint) => sprint.status === 'active')
  const selectedSummarySprint = hasActiveSprint
    ? summarySprint
    : summarySprintId
      ? availableSummarySprints.find((sprint) => sprint.id === summarySprintId) ?? null
      : null

  const handleTabChange = (nextTab: AiPlanningTab) => {
    setVisitedTabs((visited) => (
      visited.has(nextTab) ? visited : new Set(visited).add(nextTab)
    ))
    onTabChange(nextTab)
  }

  return (
    <Dialog.Root modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-drawer bg-overlay lg:bg-transparent" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-drawer flex max-h-dvh min-h-0 w-full max-w-[36rem] flex-col border-l border-line bg-surface shadow-modal">
          <header className="flex h-topbar shrink-0 items-center justify-between gap-3 border-b border-line px-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-9 shrink-0 place-content-center rounded-md bg-surface text-brand-ink">
                <Bot aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Dialog.Title className="font-heading text-heading font-semibold leading-5 text-ink">
                    AI assistant
                  </Dialog.Title>
                  {statusQuery.data?.mode === 'mock' && (
                    <span className="rounded-xs border border-brand-soft-line bg-brand-soft px-1.5 py-0.5 text-caption text-brand-ink">
                      Mock AI
                    </span>
                  )}
                </div>
                <Dialog.Description className="text-small leading-4 text-muted">
                  Chat, generate todos, plan, or summarize
                </Dialog.Description>
                <div className="flex items-center gap-2">
                  {statusQuery.isPending && <span className="text-caption text-muted">Checking AI status…</span>}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {activeTab === 'chat' && (
                <button
                  type="button"
                  onClick={() => newChatActionRef.current?.()}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-line px-2.5 text-small font-medium leading-none text-ink transition-colors hover:bg-sunken"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  New chat
                </button>
              )}
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close AI planning"
                  className="grid size-10 shrink-0 place-content-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-ink"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </Dialog.Close>
            </div>
          </header>

          <div className="flex shrink-0 items-center justify-between border-b border-line">
            <div role="tablist" aria-label="AI assistant tools" className="flex min-w-0 flex-1 gap-1 overflow-x-auto px-2">
              <AiTab
                id="chat"
                activeTab={activeTab}
                enabled
                onTabChange={handleTabChange}
                icon={<MessageCircle aria-hidden="true" className="size-4" />}
                label="Chat"
              />
              <AiTab
                id="generate"
                activeTab={activeTab}
                enabled
                onTabChange={handleTabChange}
                icon={<ListPlus aria-hidden="true" className="size-4" />}
                label="Create todos"
              />
              <AiTab
                id="plan"
                activeTab={activeTab}
                enabled
                onTabChange={handleTabChange}
                icon={<CalendarDays aria-hidden="true" className="size-4" />}
                label="Plan sprint"
              />
              <AiTab
                id="summarize"
                activeTab={activeTab}
                enabled
                onTabChange={handleTabChange}
                icon={<FileText aria-hidden="true" className="size-4" />}
                label="Summarize active sprint"
              />
            </div>
          </div>
          {statusQuery.isError && (
            <div className="shrink-0 border-b border-line px-4 py-2">
              <AiErrorState
                message={getErrorMessage(statusQuery.error)}
                onRetry={() => void statusQuery.refetch()}
              />
            </div>
          )}

          <div
            id="ai-planning-chat-panel"
            role="tabpanel"
            aria-labelledby="ai-planning-chat-tab"
            className={activeTab === 'chat' ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'hidden'}
            hidden={activeTab !== 'chat'}
          >
            {(visitedTabs.has('chat') || activeTab === 'chat') && (
              <AssistantChatContent
                active={open && activeTab === 'chat'}
                projectId={projectId}
                pageContext={pageContext}
                pendingPrompt={pendingPrompt}
                onPromptSent={onPromptSent}
                newChatActionRef={newChatActionRef}
                onOpenTodo={onOpenTodo}
              />
            )}
          </div>
          <div
            id="ai-planning-generate-panel"
            role="tabpanel"
            aria-labelledby="ai-planning-generate-tab"
            className={activeTab === 'generate' ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'hidden'}
            hidden={activeTab !== 'generate'}
          >
            {(visitedTabs.has('generate') || activeTab === 'generate') && (
              <GenerateTodosContent
                projectId={projectId}
                onClose={() => onOpenChange(false)}
                onViewBacklog={onViewBacklog}
              />
            )}
          </div>
          <div
            id="ai-planning-plan-panel"
            role="tabpanel"
            aria-labelledby="ai-planning-plan-tab"
            className={activeTab === 'plan' ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'hidden'}
            hidden={activeTab !== 'plan'}
          >
            {(visitedTabs.has('plan') || activeTab === 'plan') && (
              <PlanSprintContent
                projectId={projectId}
                onClose={() => onOpenChange(false)}
                onViewBacklog={(sprintId) => onViewBacklog(undefined, sprintId)}
              />
            )}
          </div>
          <div
            id="ai-planning-summarize-panel"
            role="tabpanel"
            aria-labelledby="ai-planning-summarize-tab"
            className={activeTab === 'summarize' ? 'min-h-0 flex-1 overflow-y-auto p-4' : 'hidden'}
            hidden={activeTab !== 'summarize'}
          >
            {(visitedTabs.has('summarize') || activeTab === 'summarize') && (
              <div className="grid content-start gap-3">
                {!hasActiveSprint && availableSummarySprints.length > 0 && (
                  <Field id="ai-summary-sprint" label="Sprint to summarize">
                    <SelectInput
                      id="ai-summary-sprint"
                      value={selectedSummarySprint?.id ?? summarySprintId}
                      onChange={(event) => {
                        setSummarySelection({
                          sourceSprintId: summarySprint?.id ?? '',
                          selectedSprintId: event.target.value,
                        })
                        onTabChange('summarize')
                      }}
                    >
                      <option value="">Choose a sprint</option>
                      {availableSummarySprints.map((sprint) => (
                        <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                      ))}
                    </SelectInput>
                  </Field>
                )}
                {selectedSummarySprint ? (
                  <SprintSummaryPanel
                    sprintId={selectedSummarySprint.id}
                    summary={selectedSummarySprint.summary}
                    className="min-h-full content-start"
                    onViewSprint={() => onViewSprint(selectedSummarySprint.id)}
                  />
                ) : (
                  <EmptyState
                    title="No sprint to summarize"
                    description={
                      availableSummarySprints.length
                        ? 'Choose a completed sprint above to generate or view its summary.'
                        : 'Start a sprint before generating an AI summary.'
                    }
                  />
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function AiTab({
  id,
  activeTab,
  enabled,
  disabledReason,
  onTabChange,
  icon,
  label,
}: {
  id: AiPlanningTab
  activeTab: AiPlanningTab
  enabled: boolean
  disabledReason?: string
  onTabChange: (tab: AiPlanningTab) => void
  icon: ReactNode
  label: string
}) {
  const active = activeTab === id
  return (
    <Tooltip content={enabled ? label : disabledReason ?? `${label} is not available here.`}>
      <button
        id={`ai-planning-${id}-tab`}
        type="button"
        role="tab"
        aria-selected={active}
        aria-disabled={!enabled}
        aria-controls={`ai-planning-${id}-panel`}
        onClick={() => {
          if (enabled) onTabChange(id)
        }}
        className={`relative flex min-h-12 shrink-0 items-center gap-2 px-3 text-small leading-none transition-colors ${
          !enabled
            ? 'cursor-not-allowed text-subtle'
            : active
              ? 'font-semibold text-brand-ink after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand'
              : 'text-muted hover:bg-sunken hover:text-ink'
        }`}
      >
        {icon}
        {label}
      </button>
    </Tooltip>
  )
}
