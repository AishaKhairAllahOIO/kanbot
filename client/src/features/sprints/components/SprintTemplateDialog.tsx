import { useState, type FormEvent } from 'react'
import { useToast } from '@/app/providers/toast'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { Field, SelectInput, TextInput } from '../../../shared/components/Field'
import {
  getSprintTemplate,
  saveSprintTemplate,
  DEFAULT_SPRINT_TEMPLATE,
  type SprintTemplate,
} from '../utils/sprintTemplates'

interface SprintTemplateDialogProps {
  open: boolean
  projectId: string
  onOpenChange: (open: boolean) => void
}

export function SprintTemplateDialog({
  open,
  projectId,
  onOpenChange,
}: SprintTemplateDialogProps) {
  const [template, setTemplate] = useState<SprintTemplate>(() => getSprintTemplate(projectId))
  const [saveError, setSaveError] = useState('')
  const showToast = useToast()

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setTemplate(getSprintTemplate(projectId))
      setSaveError('')
    }
    onOpenChange(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError('')
    try {
      saveSprintTemplate(projectId, template)
      showToast('Sprint template saved')
      onOpenChange(false)
    } catch {
      setSaveError('Sprint template could not be saved in this browser.')
    }
  }

  function handleReset() {
    setTemplate(DEFAULT_SPRINT_TEMPLATE)
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Sprint Templates & Defaults"
      description="Configure default duration and capacity for new sprints in this project."
      size="form"
    >
      <form onSubmit={handleSubmit} className="grid gap-4 py-2">
        {saveError && <p role="alert" className="text-small text-danger">{saveError}</p>}
        <Field id="default-length" label="Default Sprint Duration">
          <SelectInput
            id="default-length"
            value={String(template.defaultLengthDays)}
            onChange={(e) =>
              setTemplate((prev) => ({ ...prev, defaultLengthDays: Number(e.target.value) || 14 }))
            }
          >
            <option value="7">1 week (7 days)</option>
            <option value="14">2 weeks (14 days - recommended)</option>
            <option value="21">3 weeks (21 days)</option>
            <option value="28">4 weeks (28 days)</option>
          </SelectInput>
        </Field>

        <Field id="default-capacity" label="Default Capacity (Story Points)">
          <TextInput
            id="default-capacity"
            type="number"
            min={1}
            max={200}
            value={template.defaultCapacity}
            onChange={(e) =>
              setTemplate((prev) => ({ ...prev, defaultCapacity: Math.max(1, Number(e.target.value) || 1) }))
            }
            placeholder="e.g. 30"
          />
        </Field>

        <Field id="name-prefix" label="Default Sprint Name Prefix">
          <TextInput
            id="name-prefix"
            type="text"
            maxLength={30}
            value={template.namePrefix}
            onChange={(e) =>
              setTemplate((prev) => ({ ...prev, namePrefix: e.target.value.trim() || 'Sprint' }))
            }
            placeholder="e.g. Sprint"
          />
        </Field>

        <footer className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset defaults
          </Button>
          <div className="flex gap-2">
            <Button type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save template
            </Button>
          </div>
        </footer>
      </form>
    </Modal>
  )
}
