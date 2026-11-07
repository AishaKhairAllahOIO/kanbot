import { Bot, RefreshCw, Sparkles } from 'lucide-react'
import { getErrorMessage } from '../../../shared/api/errors'
import { Button } from '../../../shared/components/Button'
import type { SprintSummary } from '../../../shared/types/api'
import { useSummarizeSprint } from '../hooks/useSummarizeSprint'
import { AiErrorState } from './AiErrorState'
import { AssistantMarkdown } from './AssistantMarkdown'

interface SprintSummaryPanelProps {
  sprintId: string
  summary: SprintSummary | null
  disabled?: boolean
  className?: string
  onViewSprint?: () => void
}

export function SprintSummaryPanel({
  sprintId,
  summary,
  disabled = false,
  className = '',
  onViewSprint,
}: SprintSummaryPanelProps) {
  const summarizeSprint = useSummarizeSprint()
  const generatedSummary =
    summarizeSprint.data?.sprint.id === sprintId ? summarizeSprint.data.summary : null
  const content = generatedSummary ?? summary

  return (
    <section className={`theme-card grid content-start gap-3 p-4 ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-content-center rounded-md bg-brand-soft text-brand-ink">
            <Bot aria-hidden="true" className="size-4" />
          </span>
          <h3 className="font-heading text-heading font-semibold text-ink">AI Summary</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {content && onViewSprint && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onViewSprint}
            >
              View in Sprints History
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="hover:text-brand-ink"
            loading={summarizeSprint.isPending}
            disabled={disabled}
            onClick={() => summarizeSprint.mutate(sprintId)}
            leadingIcon={
              content ? (
                <RefreshCw aria-hidden="true" className="size-3.5 text-brand-ink" />
              ) : (
                <Sparkles aria-hidden="true" className="size-3.5 text-brand-ink" />
              )
            }
          >
            {content ? 'Regenerate' : 'Summarize'}
          </Button>
        </div>
      </header>

      {content ? (
        <AssistantMarkdown content={content.content} />
      ) : !summarizeSprint.isPending && (
        <p className="text-small text-muted">
          {disabled
            ? 'Start this sprint before generating a summary.'
            : 'Create an AI summary to review how this sprint went.'}
        </p>
      )}

      {summarizeSprint.isError && (
        <AiErrorState
          message={getErrorMessage(summarizeSprint.error)}
          onRetry={() => summarizeSprint.mutate(sprintId)}
        />
      )}

      {content && (
        <p className="text-caption text-muted">
          Generated {new Date(content.generatedAt).toLocaleString()}
        </p>
      )}
      <p className="text-caption text-muted">AI can make mistakes. Review before saving.</p>
    </section>
  )
}
