import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { CircleAlert } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Sprint } from '../../../shared/types/api'
import { ApiError, fieldErrors } from '../../../shared/api/client'
import { getErrorMessage } from '../../../shared/api/errors'
import { Button } from '../../../shared/components/Button'
import { Field, TextArea, TextInput } from '../../../shared/components/Field'
import { DatePickerInput } from '../../../shared/components/DatePickerInput'
import { Modal } from '../../../shared/components/Modal'
import { useCreateSprint } from '../hooks/useCreateSprint'
import { useUpdateSprint } from '../hooks/useUpdateSprint'
import { calculateSprintDatesFromTemplate } from '../utils/sprintTemplates'


const sprintSchema = z
  .object({
    name: z.string().max(80, 'Use 80 characters or fewer'),
    goal: z.string().max(300, 'Use 300 characters or fewer'),
    startDate: z.string(),
    endDate: z.string(),
  })
  .refine((values) => !values.startDate || !values.endDate || values.endDate >= values.startDate, {
    path: ['endDate'],
    message: 'End date must be on or after the start date',
  })

type SprintValues = z.infer<typeof sprintSchema>

interface SprintFormDialogProps {
  open: boolean
  projectId: string
  sprint?: Sprint
  onOpenChange: (open: boolean) => void
}

export function SprintFormDialog({ open, projectId, sprint, onOpenChange }: SprintFormDialogProps) {
  const create = useCreateSprint(projectId)
    const update = useUpdateSprint(projectId)

  const [formError, setFormError] = useState('')
  const isEditing = Boolean(sprint)
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SprintValues>({
    resolver: zodResolver(sprintSchema),
    defaultValues: { name: '', goal: '', startDate: '', endDate: '' },
  })

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setFormError('')
    onOpenChange(nextOpen)
  }

  async function onSubmit(values: SprintValues) {
    setFormError('')
    const body = {
      ...(values.name.trim() ? { name: values.name.trim() } : {}),
      goal: values.goal.trim(),
      ...(values.startDate ? { startDate: values.startDate } : {}),
      ...(values.endDate ? { endDate: values.endDate } : {}),
    }

    try {
      if (sprint) {
        await update.mutateAsync({ sprintId: sprint.id, body })
      } else {
        await create.mutateAsync(body)
      }
      handleOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped = fieldErrors(error)
        const fields = ['name', 'goal', 'startDate', 'endDate'] as const
        let matched = false
        fields.forEach((field) => {
          if (mapped[field]) {
            setError(field, { type: 'server', message: mapped[field] }, { shouldFocus: true })
            matched = true
          }
        })
        if (!matched) setFormError(getErrorMessage(error))
      } else {
        setFormError(getErrorMessage(error))
      }
    }
  }

  const isPending = create.isPending || update.isPending
  const dateError = errors.startDate?.message ?? errors.endDate?.message

  useEffect(() => {
    if (!open) return
    reset({
      name: sprint?.name ?? '',
      goal: sprint?.goal ?? '',
      startDate: sprint?.startDate ?? (isEditing ? '' : calculateSprintDatesFromTemplate(projectId).startDate),
      endDate: sprint?.endDate ?? (isEditing ? '' : calculateSprintDatesFromTemplate(projectId).endDate),
    })
  }, [open, projectId, reset, sprint?.id, sprint?.name, sprint?.goal, sprint?.startDate, sprint?.endDate, isEditing])

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={sprint ? 'Edit sprint' : 'Create sprint'}
      description="Give this sprint a clear goal and optional dates."
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <p role="alert" className="rounded-sm bg-danger/10 p-3 text-small text-ink">{formError}</p>}
        <Field id="sprint-name" label="Name" optional error={errors.name?.message}>
          <TextInput id="sprint-name" autoFocus invalid={Boolean(errors.name)} {...register('name')} />
        </Field>
        <Field id="sprint-goal" label="Goal" optional error={errors.goal?.message}>
          <TextArea id="sprint-goal" rows={3} invalid={Boolean(errors.goal)} {...register('goal')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="sprint-start-date" label="Start date" optional>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <DatePickerInput
                  id="sprint-start-date"
                  value={field.value}
                  invalid={Boolean(errors.startDate)}
                  aria-describedby={dateError ? 'sprint-dates-error' : undefined}
                  onValueChange={field.onChange}
                />
              )}
            />
          </Field>
          <Field id="sprint-end-date" label="End date" optional>
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <DatePickerInput
                  id="sprint-end-date"
                  value={field.value}
                  invalid={Boolean(errors.endDate)}
                  aria-describedby={dateError ? 'sprint-dates-error' : undefined}
                  onValueChange={field.onChange}
                />
              )}
            />
          </Field>
        </div>
        <p
          id="sprint-dates-error"
          role={dateError ? 'alert' : undefined}
          aria-live="polite"
          className="flex min-h-8 items-start gap-1 text-small text-danger"
        >
          {dateError && (
            <>
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{dateError}</span>
            </>
          )}
        </p>
        <footer className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isPending}>{sprint ? 'Save changes' : 'Create sprint'}</Button>
        </footer>
      </form>
    </Modal>
  )
}
