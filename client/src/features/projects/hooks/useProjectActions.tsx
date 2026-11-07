import { Suspense, useState } from 'react'
import { useNavigate } from 'react-router'
import type { ProjectWithStats } from '../../../shared/types/api'
import { DeleteProjectDialog } from '../components/DeleteProjectDialog'
import {
  LazyProjectEditorDialog,
  prefetchProjectEditorDialog,
} from '../components/projectEditorDialogLoader'
import { useProjectMutations } from './useProjects'

export function useProjectActions() {
  const navigate = useNavigate()
  const mutations = useProjectMutations()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectWithStats>()
  const [deleting, setDeleting] = useState<ProjectWithStats>()

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(project: ProjectWithStats) {
    setEditing(project)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return
    await mutations.remove.mutateAsync(deleting.id)
    setDeleting(undefined)
    navigate('/projects')
  }

  const dialogs = (
    <>
      {formOpen && (
        <Suspense fallback={null}>
          <LazyProjectEditorDialog
            open
            project={editing}
            onOpenChange={setFormOpen}
            onCreated={(projectId) => {
              setFormOpen(false)
              navigate(`/projects/${projectId}/backlog`)
            }}
          />
        </Suspense>
      )}
      <DeleteProjectDialog
        project={deleting}
        pending={mutations.remove.isPending}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        onConfirm={confirmDelete}
      />
    </>
  )

  return {
    mutations,
    openCreate,
    openEdit,
    openDelete: setDeleting,
    prefetchProjectEditorDialog,
    dialogs,
  }
}
