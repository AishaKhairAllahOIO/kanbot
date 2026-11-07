import type { SprintBoardResponse, TodoStatus } from '@/shared/types/api'
import { statusDot, statusNames } from '@/features/todos/config/statusConfig'
import { Tooltip } from '@/shared/components/Tooltip'

const progressStatuses: TodoStatus[] = ['done', 'in_review', 'in_progress', 'todo']

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
        role="group"
        aria-label={`Sprint progress: ${donePoints} of ${totalPoints} points done, ${progressPercent}%`}
      >
        {progressStatuses.map((status) => {
          const points = pointsByStatus[status]
          if (points === 0) return null
          const statusTodos = columns[status].length
          const statusPercent = totalPoints === 0 ? 0 : Math.round((points / totalPoints) * 100)
          return (
            <Tooltip
              key={status}
              content={`${statusNames[status]} · ${points} pts · ${statusTodos} ${statusTodos === 1 ? 'todo' : 'todos'} · ${statusPercent}%`}
            >
              <span
                role="img"
                tabIndex={0}
                aria-label={`${statusNames[status]}: ${points} points, ${statusTodos} ${statusTodos === 1 ? 'todo' : 'todos'}, ${statusPercent}%`}
                className={`h-full min-w-0 rounded-full transition-[filter,box-shadow] duration-fast hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink ${statusDot[status]}`}
                style={{
                  flex: `${points} 1 0%`,
                  transition: 'flex-grow var(--dur-slow) var(--ease)',
                }}
              />
            </Tooltip>
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
              <span aria-hidden="true" className={`size-1.5 rounded-full ${statusDot[status]}`} />
              {statusNames[status]} {pointsByStatus[status]}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
