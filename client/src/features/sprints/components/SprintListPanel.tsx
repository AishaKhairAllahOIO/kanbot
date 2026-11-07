import type { Sprint } from '../../../shared/types/api'
import { formatSprintDates } from '../utils/sprintDates'
import { SprintStatusBadge } from './SprintStatusBadge'

interface SprintListPanelProps {
  sprints: Sprint[]
  selectedSprintId: string | null
  onSelect: (sprintId: string) => void
}

export function SprintListPanel({ sprints, selectedSprintId, onSelect }: SprintListPanelProps) {
  return (
    <aside className="min-w-0">
      
      <div className="grid content-start gap-2">
        {sprints.map((sprint) => {
          const stats = sprint.completedStats ?? sprint.stats
          const selected = selectedSprintId === sprint.id

          return (
            <button
              key={sprint.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(sprint.id)}
              className={`w-full rounded-md border px-3.5 py-3 text-left transition-[border-color,background-color] hover:border-brand-soft-line/70 hover:bg-brand-soft/15 ${
                selected ? 'border-brand-soft-line/80 bg-brand-soft/20' : 'border-line bg-surface'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-body font-medium text-ink">{sprint.name}</span>
                <SprintStatusBadge status={sprint.status} />
              </span>
              <span className="mt-1 flex min-h-6 items-center justify-between gap-3">
                <span className="truncate text-caption text-muted">
                  {formatSprintDates(sprint.startDate, sprint.endDate)}
                </span>
                <span className="flex min-w-24 shrink-0 justify-end">
                  <span className="rounded-full px-2 py-0.5 text-caption font-medium tabular-nums text-brand-ink">
                    {stats.donePoints}/{stats.totalPoints} pts
                  </span>
                </span>
              </span>
              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-sunken">
                <span
                  className="block h-full rounded-full bg-brand transition-[width]"
                  style={{ width: `${stats.totalPoints ? Math.min(100, (stats.donePoints / stats.totalPoints) * 100) : 0}%` }}
                />
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
