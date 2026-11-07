import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowRight, ChevronDown, Flag, Trash2, X } from 'lucide-react'
import type { Sprint, TodoPriority } from '@/shared/types/api'
import { getErrorMessage } from '@/shared/api/errors'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Spinner } from '@/shared/components/Spinner'

interface BulkActionsBarProps {
  selectedCount: number
  sprints: Sprint[]
  isProcessing: boolean
  error?: string | null
  onClear: () => void
  onMoveToSprint: (sprintId: string | null) => Promise<void>
  onChangePriority: (priority: TodoPriority) => Promise<void>
  onDelete: () => Promise<void>
}

export function BulkActionsBar({
  selectedCount,
  sprints,
  isProcessing,
  error,
  onClear,
  onMoveToSprint,
  onChangePriority,
  onDelete,
}: BulkActionsBarProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const targetSprints = sprints.filter((s) => s.status === 'planned' || s.status === 'active')

  if (selectedCount === 0) return null

  function runAction(action: () => Promise<void>) {
    setActionError(null)
    void Promise.resolve()
      .then(action)
      .catch((cause: unknown) => setActionError(getErrorMessage(cause)))
  }

  function handleConfirmDelete() {
    setDeleteConfirmOpen(false)
    runAction(onDelete)
  }

  return (
    <>
      <aside
        aria-label="Bulk actions toolbar"
        className="theme-card fixed bottom-6 left-1/2 z-sticky flex -translate-x-1/2 flex-wrap items-center gap-2 border-line-strong px-4 py-2.5 shadow-modal"
      >
        <div className="flex items-center gap-2 border-r border-line pr-3">
          <span className="flex size-6 items-center justify-center rounded-full bg-brand-soft text-caption font-semibold text-brand-ink">
            {selectedCount}
          </span>
          <span className="text-small font-medium text-ink">
            {selectedCount === 1 ? 'todo selected' : 'todos selected'}
          </span>
          {isProcessing && <Spinner label="Processing..." />}
        </div>

        {(actionError || error) && <span role="alert" className="text-caption text-danger">{actionError || error}</span>}

        <div className="flex items-center gap-2">
          {/* Move to Sprint dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button size="sm" disabled={isProcessing} leadingIcon={<ArrowRight aria-hidden="true" className="size-3.5" />}>
                Move to
                <ChevronDown aria-hidden="true" className="ml-1 size-3" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="center"
                sideOffset={6}
                className="z-popover rounded-md border border-line bg-raised p-1 shadow-pop"
              >
                <DropdownMenu.Item className="menu-item" onSelect={() => runAction(() => onMoveToSprint(null))}>
                  Backlog
                </DropdownMenu.Item>
                {targetSprints.map((sprint) => (
                  <DropdownMenu.Item
                    key={sprint.id}
                    className="menu-item"
                    onSelect={() => runAction(() => onMoveToSprint(sprint.id))}
                  >
                    {sprint.name} {sprint.status === 'active' ? '(active)' : ''}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Change Priority dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button size="sm" disabled={isProcessing} leadingIcon={<Flag aria-hidden="true" className="size-3.5" />}>
                Priority
                <ChevronDown aria-hidden="true" className="ml-1 size-3" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="center"
                sideOffset={6}
                className="z-popover rounded-md border border-line bg-raised p-1 shadow-pop"
              >
                <DropdownMenu.Item className="menu-item" onSelect={() => runAction(() => onChangePriority('low'))}>
                  Low
                </DropdownMenu.Item>
                <DropdownMenu.Item className="menu-item" onSelect={() => runAction(() => onChangePriority('medium'))}>
                  Medium
                </DropdownMenu.Item>
                <DropdownMenu.Item className="menu-item" onSelect={() => runAction(() => onChangePriority('high'))}>
                  High
                </DropdownMenu.Item>
                <DropdownMenu.Item className="menu-item" onSelect={() => runAction(() => onChangePriority('urgent'))}>
                  Urgent
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Delete Button */}
          <Button
            size="sm"
            variant="danger"
            disabled={isProcessing}
            onClick={() => setDeleteConfirmOpen(true)}
            leadingIcon={<Trash2 aria-hidden="true" className="size-3.5" />}
          >
            Delete
          </Button>

          {/* Clear selection */}
          <button
            type="button"
            title="Deselect all"
            aria-label="Deselect all"
            onClick={onClear}
            className="grid size-8 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      </aside>

      <Modal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete ${selectedCount} ${selectedCount === 1 ? 'todo' : 'todos'}?`}
        description="Selected todos will be deleted. You can undo this for a short time after deletion."
        size="confirm"
      >
        <footer className="mt-4 flex justify-end gap-2 border-t border-line pt-3">
          <Button type="button" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirmDelete} loading={isProcessing}>
            Delete {selectedCount} {selectedCount === 1 ? 'todo' : 'todos'}
          </Button>
        </footer>
      </Modal>
    </>
  )
}
