import type { SprintStats, TodoStatus } from '../../../shared/types/api'

const statuses: TodoStatus[] = ['done', 'in_progress', 'in_review', 'todo']
const colors: Record<TodoStatus, string> = {
  todo: 'bg-line-strong',
  in_progress: 'bg-status-in-progress',
  in_review: 'bg-status-in-review',
  done: 'bg-signal',
}

export function MiniSprintRibbon({ stats }: { stats: SprintStats }) {
  const total = Object.values(stats.byStatus).reduce((sum, count) => sum + count, 0)
  return (
    <div className="flex h-1.5 w-full gap-0.5" aria-hidden="true">
      {total === 0 ? (
        <span className="w-full rounded-full bg-sunken" />
      ) : (
        statuses.map((status) =>
          stats.byStatus[status] ? (
            <span key={status} className={`min-w-1.5 rounded-sm ${colors[status]}`} style={{ flexGrow: stats.byStatus[status] }} />
          ) : null,
        )
      )}
    </div>
  )
}
