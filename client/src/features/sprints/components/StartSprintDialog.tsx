import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { getErrorMessage } from '../../../shared/api/errors'
import type { Sprint } from '../../../shared/types/api'
import { Button } from '../../../shared/components/Button'
import { Field } from '../../../shared/components/Field'
import { DatePickerInput } from '../../../shared/components/DatePickerInput'
import { Modal } from '../../../shared/components/Modal'
import { useStartSprint } from '../hooks/useStartSprint'
import { getDefaultSprintDates } from '../utils/sprintDates'

interface StartSprintDialogProps {
  open: boolean
  sprint: Sprint
  onOpenChange: (open: boolean) => void
}

export function StartSprintDialog({ open, sprint, onOpenChange }: StartSprintDialogProps) {
  const navigate = useNavigate()
  const mutations = useStartSprint(sprint.projectId)
  const [startDate, setStartDate] = useState(() => getDefaultSprintDates().startDate)
  const [endDate, setEndDate] = useState(() => getDefaultSprintDates().endDate)
  const [error, setError] = useState('')

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setError('')
    }
    onOpenChange(nextOpen)
  }

  async function startSprint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!startDate || !endDate || endDate < startDate) {
      setError('Choose an end date on or after the start date.')
      return
    }
    setError('')
    try {
      await mutations.mutateAsync({ sprintId: sprint.id, body: { startDate, endDate } })
      handleOpenChange(false)
      navigate(`/projects/${sprint.projectId}/board`)
    } catch (cause) {
      setError(getErrorMessage(cause))
    }
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title={`Start ${sprint.name}`} description="Choose when this sprint will run." size="form">
      <form onSubmit={startSprint} className="grid gap-4">
        {error && <p role="alert" className="rounded-sm bg-danger/10 p-3 text-small text-ink">{error}</p>}
        <Field id="start-date" label="Start date">
          <DatePickerInput id="start-date" value={startDate} onValueChange={setStartDate} />
        </Field>
        <Field id="end-date" label="End date">
          <DatePickerInput id="end-date" min={startDate} value={endDate} onValueChange={setEndDate} />
        </Field>
        <footer className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" variant="primary" loading={mutations.isPending}>Start sprint</Button>
        </footer>
      </form>
    </Modal>
  )
}
