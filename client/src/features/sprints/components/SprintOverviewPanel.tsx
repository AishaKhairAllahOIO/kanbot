import { ChevronDown, Download } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { SprintSummaryPanel } from '../../ai/components/SprintSummaryPanel'
import type { Sprint } from '../../../shared/types/api'
import { formatSprintDates } from '../utils/sprintDates'
import { SprintStatusBadge } from './SprintStatusBadge'
import { exportSprintSummaryToCsv, exportSprintSummaryToMarkdown } from '../utils/exportSprint'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Spinner } from '../../../shared/components/Spinner'
import { TODO_STATUSES } from '../../../shared/types/api'
import { statusBadge, statusDot, statusNames } from '../../todos/config/statusConfig'
import { useSprintBoard } from '../hooks/useSprintBoard'
import { getErrorMessage } from '../../../shared/api/errors'

interface SprintOverviewPanelProps {
  sprint: Sprint
}

export function SprintOverviewPanel({ sprint }: SprintOverviewPanelProps) {
  const boardQuery = useSprintBoard(sprint.id)
  const stats = sprint.completedStats ?? sprint.stats
  const completionPercent = stats.totalTodos
    ? Math.round((stats.doneTodos / stats.totalTodos) * 100)
    : 0
  const carriedOver = sprint.completedStats?.carriedOver ?? 0
  const sprintTodoCount = boardQuery.data
    ? TODO_STATUSES.reduce((count, status) => count + boardQuery.data.columns[status].length, 0)
    : 0

  return (
    <section className="theme-card grid min-w-0 content-start gap-4 overflow-hidden rounded-md border-t-2 border-t-brand p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-title font-semibold text-ink">{sprint.name}</h2>
            <SprintStatusBadge status={sprint.status} />
          </div>
          <p className="mt-1 text-small text-muted">
            {formatSprintDates(sprint.startDate, sprint.endDate)}
            {sprint.goal && <span className="ml-1">· Goal: {sprint.goal}</span>}
          </p>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="group hover:text-brand-ink"
              leadingIcon={<Download aria-hidden="true" className="size-3.5 text-brand-ink transition-transform duration-fast group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />}
            >
              Export summary
              <ChevronDown aria-hidden="true" className="ml-1 size-3 text-brand-ink transition-transform duration-fast group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-popover rounded-md border border-line bg-raised p-1 shadow-pop"
            >
              <DropdownMenu.Item
                className="menu-item"
                onSelect={() => exportSprintSummaryToMarkdown(sprint)}
              >
                Export as Markdown
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="menu-item"
                onSelect={() => exportSprintSummaryToCsv(sprint)}
              >
                Export as CSV
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SprintStatTile
          label="Completed todos"
          value={String(stats.doneTodos)}
          tone="success"
        />
        <SprintStatTile
          label="Points done"
          value={`${stats.donePoints} / ${stats.totalPoints}`}
          tone="info"
        />
        <SprintStatTile
          label="Carried over"
          value={carriedOver === 1 ? '1 todo' : `${carriedOver} todos`}
          tone={carriedOver ? 'warning' : 'success'}
        />
        <SprintStatTile
          label="Completion %"
          value={`${completionPercent}%`}
          tone={completionPercent >= 80 ? 'success' : completionPercent >= 50 ? 'warning' : 'danger'}
        />
      </div>

      <section className="theme-card grid content-start gap-3 p-4">
        <header className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-heading font-semibold text-ink">Sprint todos</h3>
          {boardQuery.data && (
            <span className="text-caption text-muted">
              {sprintTodoCount} {sprintTodoCount === 1 ? 'todo' : 'todos'}
            </span>
          )}
        </header>
        {boardQuery.isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner label="Loading sprint todos" />
          </div>
        ) : boardQuery.isError ? (
          <EmptyState
            title="Sprint todos could not be loaded"
            description={getErrorMessage(boardQuery.error)}
            error
            action={<Button onClick={() => void boardQuery.refetch()}>Try again</Button>}
          />
        ) : (
          <div className="grid gap-3">
            {TODO_STATUSES.map((status) => {
              const todos = boardQuery.data?.columns[status] ?? []
              if (!todos.length) return null

              return (
                <section key={status} aria-label={`${statusNames[status]} todos`}>
                  <h4 className="mb-1.5 flex items-center gap-2 text-small font-semibold text-ink">
                    <span aria-hidden="true" className={`size-2 rounded-full ${statusDot[status]}`} />
                    {statusNames[status]}
                    <span className={`rounded-full border px-1.5 py-0.5 text-caption font-medium tabular-nums ${statusBadge[status]}`}>
                      {todos.length}
                    </span>
                  </h4>
                  <ul className="divide-y divide-line rounded-sm border border-line">
                    {todos.map((todo) => (
                      <li
                        key={todo.id}
                        className="flex min-w-0 items-center gap-3 px-3 py-2 text-small"
                      >
                        <span className="shrink-0 font-mono text-key text-muted">{todo.key}</span>
                        <span className="min-w-0 flex-1 truncate text-ink">{todo.title}</span>
                        <span className="shrink-0 text-caption tabular-nums text-muted">
                          {todo.storyPoints ?? 0} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
            {sprintTodoCount === 0 && (
              <p className="py-3 text-center text-small text-muted">No todos in this sprint yet.</p>
            )}
          </div>
        )}
      </section>

      <div id="sprint-ai-summary">
        <SprintSummaryPanel
          sprintId={sprint.id}
          summary={sprint.summary}
          disabled={sprint.status === 'planned'}
          className="min-h-[24rem]"
        />
      </div>
    </section>
  )
}

function SprintStatTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'success' | 'info' | 'warning' | 'danger'
}) {
  const toneClasses = {
    success: 'border-success/20 bg-success/5 text-success',
    info: 'border-info/20 bg-info/5 text-info',
    warning: 'border-warning/25 bg-warning/5 text-warning',
    danger: 'border-danger/20 bg-danger/5 text-danger',
  } satisfies Record<typeof tone, string>

  return (
    <article className={`min-w-0 rounded-md border px-3 py-3 ${toneClasses[tone]}`}>
      <p className="truncate text-caption text-muted">{label}</p>
      <p className="mt-1 truncate font-heading text-title font-medium tabular-nums">
        {value}
      </p>
    </article>
  )
}
