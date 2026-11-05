import { TrendingDown } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import type { Sprint } from '../../../shared/types/api'
import { formatSprintDates, getSprintTimeRemaining } from '../../sprints/utils/sprintDates'

interface BoardSprintHeaderProps {
  sprint: Sprint
  showBurndown?: boolean
  onToggleBurndown?: () => void
  onComplete: () => void
}

export function BoardSprintHeader({
  sprint,
  showBurndown = false,
  onToggleBurndown,
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
        {onToggleBurndown && (
          <Button
            size="sm"
            variant={showBurndown ? 'primary' : 'secondary'}
            leadingIcon={<TrendingDown aria-hidden="true" className="size-3.5" />}
            onClick={onToggleBurndown}
          >
            {showBurndown ? 'Hide burndown' : 'Burndown chart'}
          </Button>
        )}
        <Button variant="primary" onClick={onComplete}>
          Complete sprint
        </Button>
      </div>
    </header>
  )
}
