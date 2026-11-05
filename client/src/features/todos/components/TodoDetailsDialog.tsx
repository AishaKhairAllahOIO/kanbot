import { useRef, useState, type FormEvent } from 'react'
import { Check, Plus, Sparkles, Trash2, X } from 'lucide-react'
import type { StoryPoints, Todo, TodoPriority, TodoStatus, TodoType } from '../../../shared/types/api'
import { ApiError, fieldErrors } from '../../../shared/api/client'
import { getErrorMessage } from '../../../shared/api/errors'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Field, SelectInput, TextArea, TextInput } from '../../../shared/components/Field'
import { Modal } from '../../../shared/components/Modal'
import { Skeleton } from '../../../shared/components/Skeleton'
import { useTodo, useTodoMutations } from '../hooks/useTodos'
import { useSprints } from '../../sprints/hooks/useSprints'
import { LabelBadge } from './LabelBadge'
import { useLayoutStore } from '../../../app/layouts/AppLayout/store/layoutStore'
import { buildTodoEstimatePrompt, buildTodoImprovementPrompt } from '../../ai/utils/todoPrompts'

interface TodoDraft {
  title: string
  description: string
  type: TodoType
  status: TodoStatus
  priority: TodoPriority
  storyPoints: StoryPoints | null
  labels: string[]
  dueDate: string
  sprintId: string
}

function toDraft(todo: Todo): TodoDraft {
  return {
    title: todo.title,
    description: todo.description,
    type: todo.type,
    status: todo.status,
    priority: todo.priority,
    storyPoints: todo.storyPoints,
    labels: todo.labels,
    dueDate: todo.dueDate ?? '',
    sprintId: todo.sprintId ?? '',
  }
}

const points: (StoryPoints | null)[] = [1, 2, 3, 5, 8, 13, null]

interface TodoDetailsDialogProps {
  todoId: string | null
  onOpenChange: (open: boolean) => void
}

export function TodoDetailsDialog({ todoId, onOpenChange }: TodoDetailsDialogProps) {
  const requestAssistantPrompt = useLayoutStore((state) => state.requestAssistantPrompt)
  const todoQuery = useTodo(todoId)
  const todo = todoQuery.data?.todo
  const sprintQuery = useSprints(todo?.projectId ?? '')
  const mutations = useTodoMutations(todo?.projectId ?? '')
  const [draftState, setDraftState] = useState<{ todoId: string; draft: TodoDraft } | null>(null)
  const [labelInput, setLabelInput] = useState('')
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editingLabelValue, setEditingLabelValue] = useState('')
  const [labelEditError, setLabelEditError] = useState('')
  const [previousTodoId, setPreviousTodoId] = useState(todoId)
  const [formError, setFormError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({})
  const [discardOpen, setDiscardOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const closingAfterSave = useRef(false)

  if (todoId !== previousTodoId) {
    setPreviousTodoId(todoId)
    setLabelInput('')
    setEditingLabel(null)
    setEditingLabelValue('')
    setLabelEditError('')
  }

  const draft = todo
    ? draftState?.todoId === todo.id
      ? draftState!.draft
      : toDraft(todo)
    : undefined
  const isDirty = Boolean(todo && draft && JSON.stringify(toDraft(todo)) !== JSON.stringify(draft))

  function requestClose(nextOpen: boolean) {
    if (!nextOpen && isDirty && !closingAfterSave.current) {
      setDiscardOpen(true)
      return
    }
    if (!nextOpen) closingAfterSave.current = false
    onOpenChange(nextOpen)
  }

  function update<K extends keyof TodoDraft>(key: K, value: TodoDraft[K]) {
    if (!todo || !draft) return
    setDraftState({ todoId: todo.id, draft: { ...draft, [key]: value } })
    setFieldError('')
    setServerFieldErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function addLabel(value: string) {
    const label = value.trim().replace(/,$/, '').trim()
    if (!label || !draft || draft.labels.includes(label) || draft.labels.length >= 10) return
    update('labels', [...draft.labels, label.slice(0, 30)])
    setLabelInput('')
  }

  function saveLabelEdit() {
    if (!draft || !editingLabel) return
    const label = editingLabelValue.trim()
    if (!label) {
      setLabelEditError('A label cannot be empty')
      return
    }
    if (draft.labels.some((existing) => existing !== editingLabel && existing.toLowerCase() === label.toLowerCase())) {
      setLabelEditError('That label already exists')
      return
    }
    update('labels', draft.labels.map((existing) => existing === editingLabel ? label : existing))
    setEditingLabel(null)
    setEditingLabelValue('')
    setLabelEditError('')
  }

  function cancelLabelEdit() {
    setEditingLabel(null)
    setEditingLabelValue('')
    setLabelEditError('')
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!todo || !draft) return
    if (editingLabel) {
      setLabelEditError('Save or cancel the label edit first')
      return
    }
    if (!draft.title.trim()) {
      setFieldError('Enter a todo title')
      return
    }
    setFormError('')
    setServerFieldErrors({})
    try {
      const response = await mutations.update.mutateAsync({
        todoId: todo.id,
        body: {
          title: draft.title.trim(),
          description: draft.description,
          type: draft.type,
          status: draft.status,
          priority: draft.priority,
          storyPoints: draft.storyPoints,
          labels: draft.labels,
          dueDate: draft.dueDate || null,
          sprintId: draft.sprintId || null,
        },
      })
      setDraftState({ todoId: response.todo.id, draft: toDraft(response.todo) })
      closingAfterSave.current = true
      onOpenChange(false)
    } catch (error) {
      const mapped = error instanceof ApiError ? fieldErrors(error) : {}
      setServerFieldErrors(mapped)
      setFieldError(mapped.title ?? '')
      const requestFields = ['title', 'description', 'type', 'status', 'priority', 'storyPoints', 'labels', 'dueDate', 'sprintId']
      setFormError(requestFields.some((field) => mapped[field]) ? '' : getErrorMessage(error))
    }
  }

  async function deleteTodo() {
    if (!todo) return
    try {
      await mutations.remove.mutateAsync(todo.id)
      closingAfterSave.current = true
      setDeleteOpen(false)
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        setDeleteOpen(false)
        closingAfterSave.current = true
        onOpenChange(false)
        return
      }
      setFormError(getErrorMessage(error))
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <Modal open={Boolean(todoId)} onOpenChange={requestClose} title={todo?.key ?? 'Todo details'} size="details">
        {todoQuery.isPending || (todo && !draft) ? (
          <TodoDetailsSkeleton />
        ) : todoQuery.isError || !todo || !draft ? (
          <EmptyState
            title="Todo could not be loaded"
            description={getErrorMessage(todoQuery.error)}
            error
            action={<Button onClick={() => void todoQuery.refetch()}>Try again</Button>}
          />
        ) : (
          <form onSubmit={save} className="grid gap-5">
            {formError && (
              <p role="alert" className="rounded-sm border border-danger/30 bg-danger/10 p-3 text-small text-ink">
                {formError}
              </p>
            )}
            <div className="grid gap-6 md:todo-details-grid">
              <div className="grid content-start gap-4">
                <Field id="todo-title" label="Title" error={fieldError}>
                  <TextInput
                    id="todo-title"
                    autoFocus
                    value={draft.title}
                    onChange={(event) => update('title', event.target.value)}
                    aria-describedby={fieldError ? 'todo-title-error' : undefined}
                    invalid={Boolean(fieldError || serverFieldErrors.title)}
                  />
                </Field>
                <Field id="todo-description" label="Description" optional error={serverFieldErrors.description}>
                  <TextArea
                    id="todo-description"
                    rows={8}
                    value={draft.description}
                    onChange={(event) => update('description', event.target.value)}
                    invalid={Boolean(serverFieldErrors.description)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leadingIcon={<Sparkles aria-hidden="true" className="size-4" />}
                    onClick={() =>
                      requestAssistantPrompt(
                        todo.projectId,
                        buildTodoImprovementPrompt({
                          key: todo.key,
                          title: draft.title,
                          description: draft.description,
                        }),
                      )
                    }
                  >
                    Improve with AI
                  </Button>
                </Field>
                <dl className="grid grid-cols-2 gap-3 text-small text-muted">
                  <div><dt>Created</dt><dd>{new Date(todo.createdAt).toLocaleString()}</dd></div>
                  <div><dt>Updated</dt><dd>{new Date(todo.updatedAt).toLocaleString()}</dd></div>
                </dl>
              </div>
              <div className="grid content-start gap-4">
                <Field id="todo-status" label="Status" error={serverFieldErrors.status}>
                  <SelectInput id="todo-status" aria-invalid={Boolean(serverFieldErrors.status)} value={draft.status} onChange={(event) => update('status', event.target.value as TodoStatus)}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </SelectInput>
                </Field>
                <Field id="todo-priority" label="Priority" error={serverFieldErrors.priority}>
                  <SelectInput id="todo-priority" aria-invalid={Boolean(serverFieldErrors.priority)} value={draft.priority} onChange={(event) => update('priority', event.target.value as TodoPriority)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </SelectInput>
                </Field>
                <Field id="todo-points" label="Story points" error={serverFieldErrors.storyPoints}>
                  <div id="todo-points" role="group" aria-label="Story points" aria-invalid={Boolean(serverFieldErrors.storyPoints)} aria-describedby={serverFieldErrors.storyPoints ? 'todo-points-error' : undefined} className="flex flex-wrap gap-1">
                    {points.map((point) => (
                      <button
                        key={point ?? 'none'}
                        type="button"
                        aria-pressed={draft.storyPoints === point}
                        onClick={() => update('storyPoints', point)}
                        className={`grid size-8 place-content-center rounded-sm border text-small tabular-nums ${draft.storyPoints === point ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line bg-surface text-muted hover:bg-sunken'}`}
                      >
                        {point ?? '–'}
                      </button>
                    ))}
                  </div>
                  {draft.storyPoints === null && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      leadingIcon={<Sparkles aria-hidden="true" className="size-4" />}
                      onClick={() =>
                        requestAssistantPrompt(
                          todo.projectId,
                          buildTodoEstimatePrompt({
                            key: todo.key,
                            title: draft.title,
                            description: draft.description,
                            type: draft.type,
                          }),
                        )
                      }
                      >
                      Estimate with AI
                    </Button>
                  )}
                </Field>
                <Field id="todo-type" label="Type" error={serverFieldErrors.type}>
                  <SelectInput id="todo-type" aria-invalid={Boolean(serverFieldErrors.type)} value={draft.type} onChange={(event) => update('type', event.target.value as TodoType)}>
                    <option value="task">Task</option>
                    <option value="story">Story</option>
                    <option value="bug">Bug</option>
                  </SelectInput>
                </Field>
                <Field id="todo-sprint" label="Sprint" error={serverFieldErrors.sprintId}>
                  {sprintQuery.isPending ? (
                    <div role="status" aria-label="Loading sprint options">
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : sprintQuery.isError ? (
                    <EmptyState
                      title="Sprint options could not be loaded"
                      description={getErrorMessage(sprintQuery.error)}
                      error
                      action={<Button size="sm" onClick={() => void sprintQuery.refetch()}>Try again</Button>}
                    />
                  ) : (
                    <SelectInput id="todo-sprint" aria-invalid={Boolean(serverFieldErrors.sprintId)} value={draft.sprintId} onChange={(event) => update('sprintId', event.target.value)}>
                      <option value="">Backlog</option>
                      {(sprintQuery.data?.sprints ?? [])
                        .filter((sprint) => sprint.status !== 'completed')
                        .map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
                    </SelectInput>
                  )}
                </Field>
                <Field id="todo-labels" label="Labels" optional helperText="Add a label with Enter or comma. Use the pencil to rename a label." error={labelEditError || serverFieldErrors.labels}>
                  <div aria-invalid={Boolean(serverFieldErrors.labels)} aria-describedby={serverFieldErrors.labels ? 'todo-labels-error' : undefined} className="flex min-h-9 flex-wrap items-center gap-1 rounded-sm border border-line-strong bg-surface p-1.5">
                    {draft.labels.map((label) => editingLabel === label ? (
                      <span key={label} className="inline-flex items-center gap-1 rounded-xs border border-brand/30 bg-surface px-1">
                        <input
                          autoFocus
                          value={editingLabelValue}
                          maxLength={30}
                          aria-label={`Edit label ${label}`}
                          onChange={(event) => {
                            setEditingLabelValue(event.target.value)
                            setLabelEditError('')
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              saveLabelEdit()
                            } else if (event.key === 'Escape') {
                              event.preventDefault()
                              cancelLabelEdit()
                            }
                          }}
                          className="w-24 bg-transparent px-1 text-caption text-ink outline-none"
                        />
                        <button type="button" aria-label={`Save label ${label}`} onClick={saveLabelEdit} className="text-muted hover:text-success">
                          <Check aria-hidden="true" className="size-3" />
                        </button>
                        <button type="button" aria-label={`Cancel editing label ${label}`} onClick={cancelLabelEdit} className="text-muted hover:text-ink">
                          <X aria-hidden="true" className="size-3" />
                        </button>
                      </span>
                    ) : (
                      <LabelBadge
                        key={label}
                        projectId={todo.projectId}
                        label={label}
                        onEdit={() => {
                          setEditingLabel(label)
                          setEditingLabelValue(label)
                          setLabelEditError('')
                        }}
                        onRemove={() => update('labels', draft.labels.filter((item) => item !== label))}
                      />
                    ))}
                    <input
                      id="todo-labels"
                      value={labelInput}
                      maxLength={30}
                      onChange={(event) => setLabelInput(event.target.value)}
                      placeholder={editingLabel ? 'Finish editing this label' : draft.labels.length >= 10 ? 'Maximum 10 labels' : 'Add a label...'}
                      aria-invalid={Boolean(serverFieldErrors.labels)}
                      aria-describedby={serverFieldErrors.labels ? 'todo-labels-error' : undefined}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ',') {
                          event.preventDefault()
                          addLabel(labelInput)
                        }
                        if (event.key === 'Backspace' && !labelInput && draft.labels.length) {
                          update('labels', draft.labels.slice(0, -1))
                        }
                      }}
                      disabled={Boolean(editingLabel) || draft.labels.length >= 10}
                      className="min-w-16 flex-1 bg-transparent px-1 text-small text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed"
                      aria-label="Add label"
                    />
                    <button type="button" aria-label="Add label" disabled={Boolean(editingLabel) || draft.labels.length >= 10} onClick={() => addLabel(labelInput)} className="rounded-sm p-1 text-muted hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-50">
                      <Plus aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </Field>
                <Field id="todo-due-date" label="Due date" optional error={serverFieldErrors.dueDate}>
                  <TextInput id="todo-due-date" type="date" invalid={Boolean(serverFieldErrors.dueDate)} value={draft.dueDate} onChange={(event) => update('dueDate', event.target.value)} />
                </Field>
              </div>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <Button type="button" variant="danger" leadingIcon={<Trash2 aria-hidden="true" className="size-4" />} onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" onClick={() => requestClose(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={!isDirty} loading={mutations.update.isPending}>
                  <Check aria-hidden="true" className="size-4" /> Save changes
                </Button>
              </div>
            </footer>
          </form>
        )}
      </Modal>
      <Modal
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard changes?"
        description="Your unsaved todo changes will be lost."
        size="confirm"
      >
        <div className="flex justify-end gap-2">
          <Button autoFocus onClick={() => setDiscardOpen(false)}>Keep editing</Button>
          <Button
            variant="danger"
            onClick={() => {
              setDiscardOpen(false)
              onOpenChange(false)
            }}
          >
            Discard
          </Button>
        </div>
      </Modal>
      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete “${todo?.key ?? 'todo'}”?`}
        description="This permanently deletes this todo."
        size="confirm"
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={mutations.remove.isPending} onClick={() => void deleteTodo()}>Delete todo</Button>
        </div>
      </Modal>
    </>
  )
}

function TodoDetailsSkeleton() {
  return (
    <div className="grid gap-5" role="status" aria-label="Loading todo details">
      <div className="grid gap-6 md:todo-details-grid">
        <div className="grid content-start gap-4">
          <div className="grid gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <div className="grid content-start gap-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="grid gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between border-t border-line pt-4">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  )
}
