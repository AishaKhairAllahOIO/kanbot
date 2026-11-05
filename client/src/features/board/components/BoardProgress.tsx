import type { SprintBoardResponse, TodoStatus } from '../../../shared/types/api'

const progressStatuses: TodoStatus[] = ['done', 'in_review', 'in_progress', 'todo']

const labels: Record<TodoStatus, string> = {
  done: 'Done',
  in_review: 'In Review',
  in_progress: 'In Progress',
  todo: 'To Do',
}

const colors: Record<TodoStatus, string> = {
  done: 'bg-status-done',
  in_review: 'bg-status-in-review',
  in_progress: 'bg-status-in-progress',
  todo: 'bg-status-todo',
}

export function BoardProgress({ columns }: { columns: SprintBoardResponse['columns'] }) {
  const totalTodos = progressStatuses.reduce((sum, status) => sum + columns[status].length, 0)
  const doneTodos = columns.done.length
  const pointsByStatus = progressStatuses.reduce(
    (totals, status) => {
      totals[status] = columns[status].reduce(
        (sum, todo) => sum + (todo.storyPoints ?? 0),
        0,
      )
      return totals
    },
    { done: 0, in_review: 0, in_progress: 0, todo: 0 },
  )
  const totalPoints = progressStatuses.reduce((sum, status) => sum + pointsByStatus[status], 0)
  const donePoints = pointsByStatus.done
  const progressPercent = totalPoints === 0 ? 0 : Math.round((donePoints / totalPoints) * 100)

  return (
    <section aria-label="Sprint progress" className="grid gap-2">
      <div
        className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-valuenow={donePoints}
        aria-valuemax={totalPoints}
        aria-valuetext={`${donePoints} of ${totalPoints} points done, ${progressPercent}%`}
      >
        {progressStatuses.map((status) => {
          const points = pointsByStatus[status]
          if (points === 0) return null
          return (
            <span
              key={status}
              aria-hidden="true"
              className={`h-full min-w-0 rounded-full ${colors[status]}`}
              style={{
                flex: `${points} 1 0%`,
                transition: 'flex-grow var(--dur-slow) var(--ease)',
              }}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted">
          <p>
            <span className="font-medium text-ink">{donePoints} / {totalPoints} pts done</span>
            {' · '}{progressPercent}%
          </p>
          <p>
            <span className="font-medium text-ink">{doneTodos} / {totalTodos} todos done</span>
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {progressStatuses.map((status) => (
            <li
              key={status}
              className="inline-flex items-center gap-1 text-caption text-muted"
            >
              <span aria-hidden="true" className={`size-1.5 rounded-full ${colors[status]}`} />
              {labels[status]} {pointsByStatus[status]}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
