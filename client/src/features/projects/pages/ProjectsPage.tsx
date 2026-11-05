import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { getErrorMessage } from '../../../shared/api/errors'
import type { ProjectWithStats } from '../../../shared/types/api'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Skeleton } from '../../../shared/components/Skeleton'
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle'
import { Topbar } from '@/app/layouts'
import { useProjects } from '../hooks/useProjects'
import { useProjectActions } from '../hooks/useProjectActions'
import { ProjectCard } from '../components/ProjectCard'
import { ProjectsEmptyState } from '../components/ProjectsEmptyState'
import { ProjectsWelcome } from '../components/ProjectsWelcome'
import { ProjectsToolbar } from '../components/ProjectsToolbar'

const emptyProjects: ProjectWithStats[] = []

export function ProjectsPage() {
  useDocumentTitle('Projects')
  const navigate = useNavigate()
  const projectsQuery = useProjects()
  const projectActions = useProjectActions()
  const [search, setSearch] = useState('')
  const projects = projectsQuery.data?.projects ?? emptyProjects
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return projects
    return projects.filter((project) =>
      [project.name, project.key, project.description].some((value) => value.toLocaleLowerCase().includes(query)),
    )
  }, [projects, search])

  return (
    <section>
      <Topbar
        title="Projects"
        meta={projectsQuery.isPending
          ? <span role="status" aria-label="Loading project summary"><Skeleton className="h-4 w-20" /></span>
          : <span className="shrink-0">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>}
      />

      {/* Mobile project switcher — only visible on small screens where sidebar is hidden */}
      {projects.length > 0 && (
        <div className="page-gutter border-b border-line py-3 md:hidden">
          <label htmlFor="mobile-project-switcher" className="mb-1.5 block text-caption font-medium text-muted">
            Switch project
          </label>
          <select
            id="mobile-project-switcher"
            defaultValue=""
            onChange={(e) => {
              const id = e.currentTarget.value
              if (id) navigate(`/projects/${id}/backlog`)
            }}
            className="h-9 w-full rounded-sm border border-line-strong bg-surface px-2 text-small text-ink"
          >
            <option value="" disabled>Select a project…</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.key} · {project.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <ProjectsWelcome />
      <div className="page-gutter grid gap-4 pb-8">
        <ProjectsToolbar search={search} onSearchChange={setSearch} onCreate={projectActions.openCreate} />

        {projectsQuery.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading projects">
            {Array.from({ length: 3 }, (_, index) => (
              <article key={index} className="theme-card flex min-h-[12.5rem] flex-col p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-sm" />
                  <div className="grid min-w-0 flex-1 gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-10 w-full" />
                <div className="mt-auto grid gap-2 border-t border-line pt-3">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </article>
            ))}
          </div>
        ) : projectsQuery.isError ? (
          <EmptyState
            title="Projects could not be loaded"
            description={getErrorMessage(projectsQuery.error)}
            error
            action={<Button onClick={() => void projectsQuery.refetch()}>Try again</Button>}
          />
        ) : projects.length === 0 ? (
          <ProjectsEmptyState onCreate={projectActions.openCreate} />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="No matching projects"
            description="Try another name, key, or description."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onUpdate={(body) => projectActions.mutations.update.mutateAsync({ projectId: project.id, body })}
                onEdit={() => projectActions.openEdit(project)}
                onDelete={() => projectActions.openDelete(project)}
              />
            ))}
            <button
              type="button"
              onClick={projectActions.openCreate}
              className="flex min-h-[12.5rem] items-center justify-center gap-2 rounded-md border border-dashed border-line-strong bg-surface text-body font-medium text-muted transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand-ink"
            >
              <span aria-hidden="true" className="text-heading">+</span>
              New project
            </button>
          </div>
        )}
      </div>

      {projectActions.dialogs}
    </section>
  )
}
