import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ProjectWithStats } from '../../../shared/types/api'
import type { UpdateProjectRequest } from '../../../shared/types/api'
import { ApiError, fieldErrors } from '../../../shared/api/client'
import { getErrorMessage } from '../../../shared/api/errors'
import { Button } from '../../../shared/components/Button'
import { Field, TextArea, TextInput } from '../../../shared/components/Field'
import { Modal } from '../../../shared/components/Modal'
import { useProjectMutations } from '../hooks/useProjects'
import { projectSchema, type ProjectValues } from '../schemas/projects.schemas'

interface ProjectEditorDialogProps {
  open: boolean
  project?: ProjectWithStats
  onOpenChange: (open: boolean) => void
  onCreated: (projectId: string) => void
}

export function ProjectEditorDialog({ open, project, onOpenChange, onCreated }: ProjectEditorDialogProps) {
  const mutations = useProjectMutations()
  const [formError, setFormError] = useState<{ projectId?: string; message: string }>()
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', key: '', description: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: project?.name ?? '',
        key: project?.key ?? '',
        description: project?.description ?? '',
      })
    }
  }, [open, project?.id, project?.name, project?.key, project?.description, reset])

  const isPending = mutations.create.isPending || mutations.update.isPending
  const currentValues = useWatch({
    control,
    defaultValue: {
      name: project?.name ?? '',
      key: project?.key ?? '',
      description: project?.description ?? '',
    },
  })
  const hasChanges = !project || (
    (currentValues.name ?? '').trim() !== project.name
    || ((currentValues.key ?? '').trim() !== '' && (currentValues.key ?? '').trim().toUpperCase() !== project.key)
    || currentValues.description !== project.description
  )
  const visibleFormError = formError && formError.projectId === project?.id
    ? formError.message
    : undefined

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setFormError(undefined)
    onOpenChange(nextOpen)
  }

  async function onSubmit(values: ProjectValues) {
    if (isPending || isSubmitting) return
    setFormError(undefined)
    try {
      if (project) {
        const body: UpdateProjectRequest = {
          ...(values.name !== project.name ? { name: values.name } : {}),
          ...(values.key && values.key !== project.key ? { key: values.key } : {}),
          ...(values.description !== project.description ? { description: values.description } : {}),
        }
        if (Object.keys(body).length === 0) return
        await mutations.update.mutateAsync({ projectId: project.id, body })
        handleOpenChange(false)
      } else {
        const body = {
          name: values.name,
          ...(values.key ? { key: values.key } : {}),
          description: values.description,
        }
        const response = await mutations.create.mutateAsync(body)
        onOpenChange(false)
        onCreated(response.project.id)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setError('key', { type: 'server', message: 'This key is already used' }, { shouldFocus: true })
          return
        }
        const mapped = fieldErrors(error)
        const fields = ['name', 'key', 'description'] as const
        let matched = false
        fields.forEach((field) => {
          if (mapped[field]) {
            setError(field, { type: 'server', message: mapped[field] }, { shouldFocus: true })
            matched = true
          }
        })
        if (!matched) setFormError({ projectId: project?.id, message: getErrorMessage(error) })
      } else {
        setFormError({ projectId: project?.id, message: getErrorMessage(error) })
      }
    }
  }

  const pending = isPending || isSubmitting

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={project ? 'Edit project' : 'Create project'}
      description={project ? 'Update your project details.' : 'A project keeps your backlog and sprints together.'}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {visibleFormError && (
          <p role="alert" className="rounded-sm border border-danger/30 bg-danger/10 p-3 text-small text-ink">
            {visibleFormError}
          </p>
        )}
        <Field id="project-name" label="Name" error={errors.name?.message}>
          <TextInput id="project-name" autoFocus invalid={Boolean(errors.name)} {...register('name')} />
        </Field>
        <Field
          id="project-key"
          label="Key"
          optional
          helperText={project ? 'Changing the key does not change existing todo keys.' : 'Leave empty to generate a key from the name.'}
          error={errors.key?.message}
        >
          <TextInput
            id="project-key"
            maxLength={6}
            autoCapitalize="characters"
            invalid={Boolean(errors.key)}
            {...register('key')}
            onChange={(event) => {
              setValue('key', event.currentTarget.value.toUpperCase(), {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: Boolean(errors.key),
              })
            }}
            
          />
        </Field>
        <Field id="project-description" label="Description" optional error={errors.description?.message}>
          <TextArea id="project-description" rows={3} invalid={Boolean(errors.description)} {...register('description')} />
        </Field>
        <footer className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" variant="primary" loading={pending} disabled={Boolean(project && !hasChanges)}>
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </footer>
      </form>
    </Modal>
  )
}
