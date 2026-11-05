import { FolderKanban } from 'lucide-react'
import { Button } from '../../../shared/components/Button'

export function ProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="grid min-h-72 place-content-center justify-items-center rounded-md border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      <FolderKanban aria-hidden="true" className="size-12 text-muted" />
      <h2 className="mt-4 font-heading text-heading font-semibold">No projects yet</h2>
      <p className="mt-1 text-small text-muted">Create your first project to start planning sprints.</p>
      <Button variant="primary" className="mt-4" onClick={onCreate}>Create your first project</Button>
    </section>
  )
}
