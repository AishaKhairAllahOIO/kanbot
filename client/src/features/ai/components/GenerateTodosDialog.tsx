import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import type { DraftTodo, StoryPoints, TodoPriority, TodoType } from '../../../shared/types/api'
import { getErrorMessage } from '../../../shared/api/errors'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Field, SelectInput, TextArea, TextInput } from '../../../shared/components/Field'
import { Modal } from '../../../shared/components/Modal'
import { Skeleton } from '../../../shared/components/Skeleton'
import { useCreateManyTodos } from '../../todos/hooks/useCreateManyTodos'
import { useGenerateTodos } from '../hooks/useGenerateTodos'
import { generateTodosSchema } from '../schemas/ai.schemas'
import { AiChip } from './AiChip'
import { AiErrorState } from './AiErrorState'

interface TodoDraft extends DraftTodo {
  id: string
  selected: boolean
}

interface GenerateTodosDialogProps {
  open: boolean
  projectId: string
  onOpenChange: (open: boolean) => void
}

const storyPoints: (StoryPoints | null)[] = [1, 2, 3, 5, 8, 13, null]

export function GenerateTodosDialog({ open, projectId, onOpenChange }: GenerateTodosDialogProps) {
  const [prompt, setPrompt] = useState('')
  const [count, setCount] = useState(5)
  const [promptError, setPromptError] = useState('')
  const [countError, setCountError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [drafts, setDrafts] = useState<TodoDraft[] | null>(null)
  const ai = useGenerateTodos(projectId)
  const todos = useCreateManyTodos(projectId)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setPrompt('')
      setCount(5)
      setPromptError('')
      setCountError('')
      setRequestError('')
      setDrafts(null)
    }
    onOpenChange(nextOpen)
  }

  async function generate() {
    setPromptError('')
    setCountError('')
    setRequestError('')
    const parsed = generateTodosSchema.safeParse({ prompt, count })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      if (issue?.path[0] === 'count') {
        setCountError(issue.message)
      } else {
        setPromptError(issue?.message ?? 'Check the prompt and count.')
      }
      return
    }

    try {
      const response = await ai.mutateAsync(parsed.data)
      setDrafts(
        response.todos.map((todo, index) => ({
          ...todo,
          id: `${Date.now()}-${index}`,
          selected: true,
        })),
      )
    } catch (error) {
      setRequestError(getErrorMessage(error))
    }
  }

  function updateDraft(id: string, values: Partial<TodoDraft>) {
    setDrafts(
      (current) =>
        current?.map((draft) => (draft.id === id ? { ...draft, ...values } : draft)) ?? null,
    )
  }

  async function addSelected() {
    if (!drafts) return
    const selected = drafts.filter((draft) => draft.selected)
    if (!selected.length) return

    setRequestError('')
    try {
      await todos.mutateAsync({
        todos: selected.map(({ title, description, type, priority, storyPoints: points }) => ({
          title: title.trim(),
          description,
          type,
          priority,
          storyPoints: points,
        })),
      })
      handleOpenChange(false)
    } catch (error) {
      setRequestError(getErrorMessage(error))
    }
  }

  const selectedCount = drafts?.filter((draft) => draft.selected).length ?? 0
  const skeletonCount = Number.isFinite(count)
    ? Math.min(Math.max(Math.floor(count), 1), 10)
    : 5

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Generate todos"
      description="Review every AI draft before saving."
      size="wide"
    >
      {!drafts && ai.isPending ? (
        <div className="grid gap-4" role="status" aria-label="Generating todo drafts">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="ms-auto h-8 w-14" />
          </div>
          <div className="grid max-h-[55dvh] gap-2 overflow-y-auto">
            {Array.from({ length: skeletonCount }, (_, index) => (
              <div key={index} className="grid gap-3 rounded-sm border border-dashed border-line-strong bg-surface p-3 sm:draft-grid">
                <Skeleton className="mt-2 size-4" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
          <footer className="flex justify-end gap-2 border-t border-line pt-4">
            <Button onClick={() => handleOpenChange(false)}>Cancel</Button>
          </footer>
        </div>
      ) : !drafts ? (
        <div className="grid gap-4">
          {requestError && (
            <AiErrorState message={requestError} onRetry={() => void generate()} />
          )}
          <Field
            id="generate-prompt"
            label="Describe a feature"
            helperText="A short brief or one idea per line works well."
            error={promptError}
          >
            <TextArea
              id="generate-prompt"
              rows={5}
              maxLength={2000}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe a feature…"
              invalid={Boolean(promptError)}
            />
          </Field>
          <Field
            id="generate-count"
            label="Number of drafts"
            helperText="Choose between 1 and 10. The default is 5."
            error={countError}
          >
            <TextInput
              id="generate-count"
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              invalid={Boolean(countError)}
            />
          </Field>
          <p className="rounded-sm border border-brand-soft-line bg-brand-soft p-3 text-small text-muted">
            AI can make mistakes. Review before saving.
          </p>
          <footer className="flex justify-end gap-2 border-t border-line pt-4">
            <Button onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={ai.isPending}
              leadingIcon={<Sparkles aria-hidden="true" className="size-4" />}
              onClick={() => void generate()}
            >
              Generate
            </Button>
          </footer>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <AiChip />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDrafts(null)
                setRequestError('')
              }}
            >
              Back
            </Button>
          </div>
          {drafts.length === 0 ? (
            <EmptyState
              title="No todo drafts were generated"
              description="Try generating again with a more specific description."
              action={<Button onClick={() => void generate()}>Try again</Button>}
            />
          ) : (
          <div className="grid gap-2">
            {drafts.map((draft, index) => (
              <article
                key={draft.id}
                className="grid gap-3 rounded-sm border border-dashed border-line-strong bg-surface p-3 sm:draft-grid"
              >
                <input
                  type="checkbox"
                  checked={draft.selected}
                  onChange={(event) =>
                    updateDraft(draft.id, { selected: event.target.checked })
                  }
                  aria-label={`Include todo ${index + 1} in the backlog`}
                  className="mt-2 size-4 accent-brand"
                />
                <TextInput
                  aria-label={`Todo title ${index + 1}`}
                  value={draft.title}
                  onChange={(event) => updateDraft(draft.id, { title: event.target.value })}
                  className="min-w-0"
                />
                <SelectInput
                  aria-label={`Todo type ${index + 1}`}
                  value={draft.type}
                  onChange={(event) =>
                    updateDraft(draft.id, { type: event.target.value as TodoType })
                  }
                >
                  <option value="task">Task</option>
                  <option value="story">Story</option>
                  <option value="bug">Bug</option>
                </SelectInput>
                <SelectInput
                  aria-label={`Todo priority ${index + 1}`}
                  value={draft.priority}
                  onChange={(event) =>
                    updateDraft(draft.id, { priority: event.target.value as TodoPriority })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </SelectInput>
                <SelectInput
                  aria-label={`Story points ${index + 1}`}
                  value={draft.storyPoints ?? ''}
                  onChange={(event) =>
                    updateDraft(draft.id, {
                      storyPoints: event.target.value
                        ? (Number(event.target.value) as StoryPoints)
                        : null,
                    })
                  }
                >
                  {storyPoints.map((points) => (
                    <option key={points ?? 'none'} value={points ?? ''}>
                      {points ?? '–'}
                    </option>
                  ))}
                </SelectInput>
                {draft.description && (
                  <p className="text-small text-muted sm:col-start-2 sm:col-end-6">
                    {draft.description}
                  </p>
                )}
              </article>
            ))}
          </div>
          )}
          {requestError && (
            <AiErrorState message={requestError} onRetry={() => void addSelected()} />
          )}
          <p className="text-small text-muted">AI can make mistakes. Review before saving.</p>
          <footer className="flex justify-end gap-2 border-t border-line pt-4">
            <Button onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!selectedCount}
              loading={todos.isPending}
              leadingIcon={<Check aria-hidden="true" className="size-4" />}
              onClick={() => void addSelected()}
            >
              Add {selectedCount} to backlog
            </Button>
          </footer>
        </div>
      )}
    </Modal>
  )
}
