import { FolderPlus, Search } from 'lucide-react'
import { Button } from '../../../shared/components/Button'

interface ProjectsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  onCreate: () => void
}

export function ProjectsToolbar({ search, onSearchChange, onCreate }: ProjectsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="font-heading text-body font-semibold text-ink">Your projects</h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative block min-w-0 sm:w-64 lg:w-72">
          <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            data-shortcut-search
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="h-10 w-full rounded-sm border border-line-strong bg-surface ps-9 pe-3 text-body text-ink placeholder:text-subtle"
          />
        </label>
        <Button
          variant="primary"
          size="sm"
          className="min-h-10 shrink-0"
          leadingIcon={<FolderPlus aria-hidden="true" className="size-4" />}
          onClick={onCreate}
        >
          New project
        </Button>
      </div>
    </div>
  )
}
