import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Star } from 'lucide-react'
import { Link } from 'react-router'
import { useCurrentProject } from '../../../shared/hooks/useCurrentProject'
import { useStarredProjects } from '../hooks/useStarredProjects'
import { prefetchRoute } from '../../../../../providers/router/routeModules'

interface StarredProjectsMenuProps {
  className: string
  side: 'right' | 'top'
  showLabel?: boolean
}

export function StarredProjectsMenu({
  className,
  side,
  showLabel = false,
}: StarredProjectsMenuProps) {
  const { projects, projectsLoading } = useCurrentProject()
  const { starredIds } = useStarredProjects()
  const starredProjects = projects.filter((project) => starredIds.includes(project.id))

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" aria-label="Starred projects" title="Starred projects" className={className}>
          <Star aria-hidden="true" className="size-5 shrink-0" />
          {showLabel && <span>Starred</span>}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="center"
          side={side}
          sideOffset={8}
          className="z-popover max-h-80 overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-pop"
        >
          {starredProjects.map((project) => (
            <DropdownMenu.Item key={project.id} asChild>
              <Link
                to={`/projects/${project.id}/backlog`}
                onPointerEnter={() => prefetchRoute(`/projects/${project.id}/backlog`)}
                onFocus={() => prefetchRoute(`/projects/${project.id}/backlog`)}
                className="flex min-h-10 items-center gap-2 rounded-sm px-3 text-small text-ink outline-none hover:bg-sunken focus:bg-sunken"
              >
                <Star aria-hidden="true" className="size-4 shrink-0 fill-star text-star" />
                <span className="truncate">{project.name}</span>
              </Link>
            </DropdownMenu.Item>
          ))}
          {starredProjects.length === 0 && (
            <p className="px-3 py-2 text-small text-muted">
              {projectsLoading ? 'Loading projects…' : 'Star a project to pin it here.'}
            </p>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
