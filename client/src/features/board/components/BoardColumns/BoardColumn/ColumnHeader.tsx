import { ChevronsLeftRight, ChevronsRightLeft } from 'lucide-react'
import type { TodoStatus } from '@/shared/types/api'
import { Tooltip } from '@/shared/components/Tooltip'
import {
  statusBadge,
  statusDot,
  statusHoverText,
  statusNames,
} from '@/features/todos/config/statusConfig'

interface ColumnHeaderProps {
  status: TodoStatus
  headingId: string
  count: number
  points: number
  collapsed: boolean
  onToggleCollapsed: (status: TodoStatus) => void
}

export function ColumnHeader({
  status,
  headingId,
  count,
  points,
  collapsed,
  onToggleCollapsed,
}: ColumnHeaderProps) {
  return (
    <header
      className={`flex w-full items-center gap-2 px-1 py-1 ${collapsed ? 'lg:flex-col' : 'mb-3'}`}
    >
      <Tooltip content={`${collapsed ? 'Expand' : 'Collapse'} ${statusNames[status]}`}>
        <button
          type="button"
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${statusNames[status]} column`}
          aria-expanded={!collapsed}
          onClick={() => onToggleCollapsed(status)}
          className="group hidden size-7 shrink-0 place-content-center rounded-sm text-muted lg:grid"
        >
          {collapsed ? (
            <ChevronsLeftRight
              aria-hidden="true"
              className={`size-4 ${statusHoverText[status]}`}
            />
          ) : (
            <ChevronsRightLeft
              aria-hidden="true"
              className={`size-4 ${statusHoverText[status]}`}
            />
          )}
        </button>
      </Tooltip>
      {!collapsed ? (
        <>
          <span
            aria-hidden="true"
            className={`size-2 shrink-0 rounded-full ${statusDot[status]}`}
          />
          <h2
            id={headingId}
            className="min-w-0 truncate text-subheading font-semibold text-ink"
          >
            {statusNames[status]}
          </h2>
          <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-caption font-semibold tabular-nums ${statusBadge[status]}`}>
            {count}
          </span>
          <span className={`ms-auto shrink-0 rounded-full border px-2 py-1 text-small font-semibold tabular-nums ${statusBadge[status]}`}>
            {points} pts
          </span>
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className={`size-2 shrink-0 rounded-full ${statusDot[status]} lg:hidden`}
          />
          <h2
            id={headingId}
            className="min-w-0 truncate text-subheading font-semibold text-ink lg:overflow-visible lg:whitespace-nowrap lg:[writing-mode:vertical-rl] lg:rotate-180 lg:text-small"
          >
            {statusNames[status]}
          </h2>
          <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-caption font-semibold tabular-nums ${statusBadge[status]}`}>
            {count}
          </span>
        </>
      )}
    </header>
  )
}
