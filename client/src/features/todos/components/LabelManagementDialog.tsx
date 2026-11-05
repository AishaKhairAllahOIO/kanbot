import { Tag } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { useLabelColors } from '../hooks/useLabelColors'
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
      <div className="grid gap-4 py-2">
        {uniqueLabels.length === 0 ? (
          <div className="rounded-sm border border-line bg-sunken p-6 text-center text-small text-muted">
            <Tag aria-hidden="true" className="mx-auto mb-2 size-6 opacity-40" />
            <p className="font-medium text-ink">No labels found yet</p>
            <p className="mt-1">Add labels (tags) when creating or editing any todo, and they will appear here.</p>
          </div>
        ) : (
          <div className="max-h-96 divide-y divide-line overflow-y-auto">
            {uniqueLabels.map((label) => {
              const activeColor = getColor(label)
              return (
                <div key={label} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <LabelBadge projectId={projectId} label={label} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {palette.map((color) => {
                      const isSelected = activeColor.id === color.id
                      return (
                        <button
                          key={color.id}
                          type="button"
                          title={color.name}
                          onClick={() => setColor(label, color.id)}
                          className={`size-5 rounded-full border transition-transform ${
                            isSelected ? 'scale-125 ring-2 ring-brand ring-offset-1' : 'hover:scale-110'
                          }`}
                          style={{
                            backgroundColor: color.text,
                            borderColor: color.border,
                          }}
                        />
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => resetColor(label)}
                      className="ml-2 text-caption text-muted hover:text-ink underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
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

