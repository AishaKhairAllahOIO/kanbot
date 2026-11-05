import { AlertCircle, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '@/shared/config/paths'
import type { ProjectWithStats } from '@/shared/types/api'
import { Skeleton } from '@/shared/components/Skeleton'

interface BreadcrumbsProps {
  /** Current page title. Rendered as the page h1. */
  title: string
  projectId?: string
  project?: ProjectWithStats
  projectLoading?: boolean
  projectError?: boolean
  onRetryProject?: () => void
}

function Separator() {
  return <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-subtle" />
}

/**
 * Projects / <project> / <page>. On small screens it shortens to <key> / <page>.
 * The last item is the current page, so it is the h1 and not a link.
 */
export function Breadcrumbs({
  title,
  projectId,
  project,
  projectLoading = false,
  projectError = false,
  onRetryProject,
}: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-2 text-small text-muted">
        {projectId && (
          <>
            <li className="hidden shrink-0 sm:block">
              <Link to={paths.projects} className="hover:text-ink">
                Projects
              </Link>
            </li>
            <li className="hidden shrink-0 sm:block">
              <Separator />
            </li>
            <li className="min-w-0 shrink truncate">
              {projectLoading ? (
                <>
                  <Skeleton className="h-4 w-12 sm:hidden" />
                  <Skeleton className="hidden h-4 w-24 sm:block" />
                </>
              ) : projectError || !project ? (
                <span role="alert" className="inline-flex items-center gap-1 text-danger">
                  <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="sr-only">Project is unavailable.</span>
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={onRetryProject}
                    aria-label="Project is unavailable. Try again."
                  >
                    Retry
                  </button>
                </span>
              ) : (
                <Link to={`/projects/${projectId}/backlog`} className="hover:text-ink">
                  <span className="sm:hidden">{project.key}</span>
                  <span className="hidden sm:inline">{project.name}</span>
                </Link>
              )}
            </li>
            <li className="shrink-0">
              <Separator />
            </li>
          </>
        )}
        <li className="min-w-0">
          <h1 aria-current="page" className="truncate font-heading text-body font-semibold text-ink">
            {title}
          </h1>
        </li>
      </ol>
    </nav>
  )
}
