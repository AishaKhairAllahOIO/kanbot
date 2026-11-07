import { Folder, Pencil, Star, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { prefetchRoute } from '@/app/providers/router/routeModules'
import type { ProjectWithStats } from '../../../shared/types/api'
import type { UpdateProjectRequest } from '../../../shared/types/api'
import { useStarredProjects } from '@/app/layouts'
import { InlineProjectField } from './InlineProjectField'
import { ProjectReminderToggle } from '@/features/notifications/components/ProjectReminderToggle'

interface ProjectCardProps {
  project: ProjectWithStats
  onUpdate: (body: UpdateProjectRequest) => Promise<unknown>
  onEdit: () => void
  onDelete: () => void
  onPrefetchEditor: () => void
}

export function ProjectCard({ project, onUpdate, onEdit, onDelete, onPrefetchEditor }: ProjectCardProps) {
  const activeSprint = project.stats.activeSprint
  const { isStarred, toggleStar } = useStarredProjects()
  const starred = isStarred(project.id)

  function saveField(field: keyof Pick<UpdateProjectRequest, 'name' | 'key' | 'description'>, value: string) {
    if (field === 'name') return onUpdate({ name: value })
    if (field === 'key') return onUpdate({ key: value })
    return onUpdate({ description: value })
  }

  return (
    <article className="theme-card theme-card-interactive flex min-h-[12.5rem] flex-col p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-content-center rounded-sm bg-brand-soft text-brand-ink">
          <Folder aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="min-w-0 truncate font-heading text-body font-semibold text-ink">
            <InlineProjectField
              projectId={project.id}
              projectName={project.name}
              field="name"
              label="Project name"
              value={project.name}
              displayClassName="truncate font-heading text-body font-semibold text-ink"
              onSave={(value) => saveField('name', value)}
            />
          </h3>
          <div className="mt-1">
            <InlineProjectField
              projectId={project.id}
              projectName={project.name}
              field="key"
              label="Project key"
              value={project.key}
              displayClassName="rounded-xs bg-brand-soft px-1.5 py-0.5 font-mono text-key text-brand-ink"
              onSave={(value) => saveField('key', value)}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label={starred ? `Unstar ${project.name}` : `Star ${project.name}`}
            aria-pressed={starred}
            onClick={() => toggleStar(project.id)}
            className="rounded-sm p-2 text-muted hover:bg-sunken hover:text-star"
          >
            <Star aria-hidden="true" className={`size-4 ${starred ? 'fill-star text-star' : ''}`} />
          </button>
          <ProjectReminderToggle projectId={project.id} projectName={project.name} />
          <button
            type="button"
            aria-label={`Edit ${project.name}`}
            onClick={onEdit}
            onPointerEnter={onPrefetchEditor}
            onFocus={onPrefetchEditor}
            className="rounded-sm p-2 text-muted hover:bg-sunken hover:text-ink"
          >
            <Pencil aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${project.name}`}
            onClick={onDelete}
            className="rounded-sm p-2 text-muted hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 min-h-10 text-small text-muted">
        <InlineProjectField
          projectId={project.id}
          projectName={project.name}
          field="description"
          label="Project description"
          value={project.description}
          emptyText="No description"
          displayClassName="line-clamp-2 w-full text-small text-muted"
          multiline
          onSave={(value) => saveField('description', value)}
        />
      </div>
      <div className="mt-auto border-t border-line pt-2">
        <div className="flex min-w-0 items-center justify-between gap-2 text-caption text-muted">
          <span>{project.stats.backlogCount} backlog</span>
          {activeSprint ? (
            <Link
              to={`/projects/${project.id}/board`}
              onPointerEnter={() => prefetchRoute(`/projects/${project.id}/board`)}
              onFocus={() => prefetchRoute(`/projects/${project.id}/board`)}
              className="inline-flex min-w-0 max-w-[60%] items-center gap-1.5 text-ink hover:text-brand-ink"
            >
              <span className="size-2 shrink-0 rounded-full bg-signal" />
              <span className="truncate">{activeSprint.name} active</span>
            </Link>
          ) : (
            <span className="truncate">No active sprint</span>
          )}
        </div>
        <Link
          to={`/projects/${project.id}/backlog`}
          onPointerEnter={() => prefetchRoute(`/projects/${project.id}/backlog`)}
          onFocus={() => prefetchRoute(`/projects/${project.id}/backlog`)}
          className="mt-2 flex min-h-9 items-center justify-center rounded-sm border border-brand/30 text-small font-medium text-brand-ink transition-colors hover:bg-brand-soft"
        >
          Open project
        </Link>
      </div>
    </article>
  )
}
