import { Bot, TrendingDown } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Tooltip } from '@/shared/components/Tooltip'
import type { Sprint } from '@/shared/types/api'
import { formatSprintDates, getSprintTimeRemaining } from '@/features/sprints/utils/sprintDates'

interface BoardSprintHeaderProps {
  sprint: Sprint
  showBurndown?: boolean
  onToggleBurndown?: () => void
  onPrefetchBurndown?: () => void
  onSummarize: () => void
  onComplete: () => void
}

export function BoardSprintHeader({
  sprint,
  showBurndown = false,
  onToggleBurndown,
  onPrefetchBurndown,
  onSummarize,
  onComplete,
}: BoardSprintHeaderProps) {
  const timeRemaining = getSprintTimeRemaining(sprint.endDate)

  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="font-heading text-heading font-semibold text-ink">{sprint.name}</h2>
          <span className="text-small text-muted">{formatSprintDates(sprint.startDate, sprint.endDate)}</span>
          {timeRemaining && (
            <span className={`text-small ${timeRemaining.days < 0 ? 'text-danger' : 'text-success'}`}>
              {timeRemaining.label}
            </span>
          )}
        </div>
        {sprint.goal && <p className="text-small text-muted">Goal: {sprint.goal}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Tooltip content="Summarize the active sprint">
          <Button
            size="md"
            variant="secondary"
            aria-label="Summarize sprint"
            leadingIcon={<Bot aria-hidden="true" className="size-4 text-brand-ink" />}
            className="group w-40"
            onClick={onSummarize}
          >
            Summary
          </Button>
        </Tooltip>
        {onToggleBurndown && (
          <Button
            size="md"
            variant={showBurndown ? 'primary' : 'secondary'}
            leadingIcon={<TrendingDown aria-hidden="true" className={`size-4 ${showBurndown ? 'text-on-brand' : 'text-brand-ink'}`} />}
            className="w-40"
            onClick={onToggleBurndown}
            onPointerEnter={onPrefetchBurndown}
            onFocus={onPrefetchBurndown}
          >
            {showBurndown ? 'Hide burndown' : 'Burndown chart'}
          </Button>
        )}
        <Button size="md" variant="primary" className="w-40" onClick={onComplete}>
          Complete sprint
        </Button>
      </div>
    </header>
  )
}
