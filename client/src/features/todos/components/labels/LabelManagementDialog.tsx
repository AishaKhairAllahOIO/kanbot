import { RotateCcw, Tag } from 'lucide-react'
import { Modal } from '@/shared/components/Modal'
import { Button } from '@/shared/components/Button'
import { useLabelColors } from '@/features/todos/hooks/useLabelColors'
import { ColorSwatches } from './ColorSwatches'
import { LabelBadge } from './LabelBadge'

interface LabelManagementDialogProps {
  open: boolean
  projectId: string
  allLabels: string[]
  onOpenChange: (open: boolean) => void
}

export function LabelManagementDialog({
  open,
  projectId,
  allLabels,
  onOpenChange,
}: LabelManagementDialogProps) {
  const { palette, getColor, setColor, resetColor } = useLabelColors(projectId)
  const uniqueLabels = Array.from(new Set(allLabels)).sort()

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Label Colors"
      description="Choose custom colors for your project tags and labels."
      size="form"
    >
      <div className="py-2">
        {uniqueLabels.length === 0 ? (
          <div className="rounded-sm border border-line bg-sunken p-6 text-center text-small text-muted">
            <Tag aria-hidden="true" className="mx-auto mb-2 size-6 opacity-40" />
            <p className="font-medium text-ink">No labels found yet</p>
            <p className="mt-1">
              Add labels (tags) when creating or editing any todo, and they will appear here.
            </p>
          </div>
        ) : (
          <ul className="max-h-96 divide-y divide-line overflow-y-auto">
            {uniqueLabels.map((label) => (
              <li key={label} className="grid gap-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <LabelBadge projectId={projectId} label={label} />
                  <button
                    type="button"
                    onClick={() => resetColor(label)}
                    aria-label={`Reset color for ${label}`}
                    className="inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-caption text-muted hover:bg-sunken hover:text-ink"
                  >
                    <RotateCcw aria-hidden="true" className="size-3" />
                    Reset
                  </button>
                </div>
                <ColorSwatches
                  label={label}
                  palette={palette}
                  selectedId={getColor(label).id}
                  onSelect={(colorId) => setColor(label, colorId)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="mt-4 flex justify-end border-t border-line pt-3">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </footer>
    </Modal>
  )
}