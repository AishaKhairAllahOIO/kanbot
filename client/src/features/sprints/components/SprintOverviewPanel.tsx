import { ChevronDown, Download } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { SprintSummaryPanel } from '../../ai/components/SprintSummaryPanel'
import type { Sprint } from '../../../shared/types/api'
import { formatSprintDates } from '../utils/sprintDates'
import { SprintStatusBadge } from './SprintStatusBadge'
import { exportSprintSummaryToCsv, exportSprintSummaryToMarkdown } from '../utils/exportSprint'
import { Button } from '../../../shared/components/Button'

interface SprintOverviewPanelProps {
  sprint: Sprint
}

export function SprintOverviewPanel({ sprint }: SprintOverviewPanelProps) {
  const stats = sprint.completedStats ?? sprint.stats
  const completionPercent = stats.totalTodos
    ? Math.round((stats.doneTodos / stats.totalTodos) * 100)
    : 0
  const carriedOver = sprint.completedStats?.carriedOver ?? 0

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
              leadingIcon={<Download aria-hidden="true" className="size-3.5" />}
            >
              Export summary
              <ChevronDown aria-hidden="true" className="ml-1 size-3" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-popover min-w-40 rounded-md border border-line bg-raised p-1 shadow-pop"
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
        <SprintStatTile label="Completed todos" value={String(stats.doneTodos)} />
        <SprintStatTile label="Points done" value={`${stats.donePoints} / ${stats.totalPoints}`} />
        <SprintStatTile
          label="Carried over"
          value={carriedOver === 1 ? '1 todo' : `${carriedOver} todos`}
        />
        <SprintStatTile label="Completion %" value={`${completionPercent}%`} />
      </div>

      <SprintSummaryPanel
        sprintId={sprint.id}
        summary={sprint.summary}
        disabled={sprint.status === 'planned'}
        className="min-h-[24rem]"
      />
    </section>
  )
}

function SprintStatTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="min-w-0 rounded-md border border-line bg-canvas/70 px-3 py-3 transition-colors hover:border-brand-soft-line hover:bg-brand-soft/30">
      <p className="truncate text-caption text-muted">{label}</p>
      <p className="mt-1 truncate font-heading text-title font-medium tabular-nums text-ink">
        {value}
      </p>
    </article>
  )
}
