import { useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { getErrorMessage } from '../../../shared/api/errors'
import type { ProjectWithStats } from '../../../shared/types/api'
import { Button } from '../../../shared/components/Button'
import { TextInput } from '../../../shared/components/Field'
import { Modal } from '../../../shared/components/Modal'

interface DeleteProjectDialogProps {
  project?: ProjectWithStats
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function DeleteProjectDialog({ project, pending, onOpenChange, onConfirm }: DeleteProjectDialogProps) {
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const submitLock = useRef(false)
  const canDelete = Boolean(project && confirmation.trim() === project.name)

  async function handleConfirm() {
    if (!canDelete || pending || submitLock.current) return
    submitLock.current = true
    setError('')
    try {
      await onConfirm()
      setConfirmation('')
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      submitLock.current = false
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError('')
      setConfirmation('')
    }
    onOpenChange(open)
  }

  return (
    <Modal
      open={Boolean(project)}
      onOpenChange={handleOpenChange}
      title={`Delete “${project?.name ?? 'project'}”?`}
      description="This permanently deletes the project and all its todos and sprints."
      size="confirm"
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          void handleConfirm()
        }}
      >
        <div className="flex items-start gap-2 rounded-sm border border-danger/20 bg-danger/5 p-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
          <p className="text-small text-ink">
            <span className="font-semibold text-danger">This cannot be undone.</span>
            {' '}Deleting this project will permanently remove all of its todos and sprints.
          </p>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="delete-project-name" className="text-small font-medium text-ink">
            To confirm deletion, type this project name exactly:
          </label>
          <span className="w-fit rounded-xs bg-danger/10 px-2 py-1 font-mono text-small font-semibold text-danger">
            {project?.name}
          </span>
          <TextInput
            id="delete-project-name"
            autoFocus
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.currentTarget.value)}
            aria-invalid={confirmation.length > 0 && !canDelete ? true : undefined}
            aria-describedby={error ? 'delete-project-name-error' : 'delete-project-name-hint'}
className="border-danger/50 bg-danger/5 focus:border-danger focus:outline-none focus:ring-0 focus-visible:outline-none"          />
          {!error && (
            <p id="delete-project-name-hint" className="text-caption text-muted">
              The delete button will be enabled once the name matches.
            </p>
          )}
        </div>
        {error && <p id="delete-project-name-error" role="alert" className="text-small text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" disabled={pending} onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" variant="danger" loading={pending} disabled={!canDelete}>
            Delete project
          </Button>
        </div>
      </form>
    </Modal>
  )
}
