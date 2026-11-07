import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapsibleSectionHeaderProps {
  variant: 'backlog' | 'sprint'
  expanded: boolean
  onToggle: () => void
  children: ReactNode
  actions?: ReactNode
}

export function CollapsibleSectionHeader({
  variant,
  expanded,
  onToggle,
  children,
  actions,
}: CollapsibleSectionHeaderProps) {
  const isBacklog = variant === 'backlog'

  return (
    <div
      className={
        isBacklog
          ? 'flex min-h-12 w-full items-center justify-between border-b border-line bg-brand-soft/50 px-3'
          : 'flex min-h-12 flex-wrap items-center gap-2 border-b border-line bg-info/5 px-3 py-2'
      }
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={
          isBacklog
            ? 'flex min-h-12 flex-1 items-center gap-2 text-left transition-colors hover:text-brand-ink'
            : 'flex min-h-10 min-w-40 flex-1 items-center gap-2 text-start'
        }
      >
        {expanded ? (
          <ChevronDown
            aria-hidden="true"
            className={`size-4 shrink-0 ${isBacklog ? 'text-brand-ink' : 'text-muted'}`}
          />
        ) : (
          <ChevronRight
            aria-hidden="true"
            className={`size-4 shrink-0 ${isBacklog ? 'text-brand-ink' : 'text-muted'}`}
          />
        )}
        {children}
      </button>
      {actions}
    </div>
  )
}
