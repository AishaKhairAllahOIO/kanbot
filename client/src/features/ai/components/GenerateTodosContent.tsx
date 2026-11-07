import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Check } from 'lucide-react'
import type { DraftTodo, StoryPoints, TodoPriority, TodoType } from '../../../shared/types/api'
import { getErrorMessage } from '../../../shared/api/errors'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Field, SelectInput, TextArea, TextInput } from '../../../shared/components/Field'
import { useCreateManyTodos } from '../../todos/hooks/useCreateManyTodos'
import { useGenerateTodos } from '../hooks/useGenerateTodos'
import { generateTodosSchema } from '../schemas/ai.schemas'
import { AiErrorState } from './AiErrorState'

interface TodoDraft extends DraftTodo {
  id: string
  selected: boolean
}

interface GenerateTodosContentProps {
  projectId: string
  onClose: () => void
  onViewBacklog: (todoIds: string[]) => void
}

const storyPoints: (StoryPoints | null)[] = [1, 2, 3, 5, 8, 13, null]

export function GenerateTodosContent({
  projectId,
  onClose,
  onViewBacklog,
}: GenerateTodosContentProps) {
  const [prompt, setPrompt] = useState('')
  const [count, setCount] = useState(5)
  const [promptError, setPromptError] = useState('')
  const [countError, setCountError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [errorAction, setErrorAction] = useState<'generate' | 'add'>('generate')
  const [drafts, setDrafts] = useState<TodoDraft[] | null>(null)
  const [createdTodoIds, setCreatedTodoIds] = useState<string[] | null>(null)
  const [scrollEdges, setScrollEdges] = useState({ top: false, bottom: false })
  const draftsScrollRef = useRef<HTMLDivElement>(null)
  const ai = useGenerateTodos(projectId)
  const todos = useCreateManyTodos(projectId)

  useEffect(() => {
    const scrollElement = draftsScrollRef.current
    if (!scrollElement) return

    const updateScrollEdges = () => {
      const top = scrollElement.scrollTop > 0
      const bottom =
        scrollElement.scrollTop + scrollElement.clientHeight < scrollElement.scrollHeight - 1
      setScrollEdges((current) =>
        current.top === top && current.bottom === bottom ? current : { top, bottom },
      )
    }

    const resizeObserver = new ResizeObserver(updateScrollEdges)
    resizeObserver.observe(scrollElement)
    if (scrollElement.firstElementChild) resizeObserver.observe(scrollElement.firstElementChild)
    scrollElement.addEventListener('scroll', updateScrollEdges, { passive: true })
    updateScrollEdges()

    return () => {
      resizeObserver.disconnect()
      scrollElement.removeEventListener('scroll', updateScrollEdges)
    }
  }, [drafts, ai.isPending])

  async function generate() {
    setPromptError('')
    setCountError('')
    setRequestError('')
    setErrorAction('generate')
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

  function toggleAllDrafts(selected: boolean) {
    setDrafts((current) => current?.map((draft) => ({ ...draft, selected })) ?? null)
  }

  async function addSelected() {
    if (!drafts) return
    const selected = drafts.filter((draft) => draft.selected)
    if (!selected.length) return

    setRequestError('')
    setErrorAction('add')
    try {
      const { todos: createdTodos } = await todos.mutateAsync({
        todos: selected.map(({ title, description, type, priority, storyPoints: points }) => ({
          title: title.trim(),
          description,
          type,
          priority,
          storyPoints: points,
        })),
      })
      window.dispatchEvent(
        new CustomEvent('kanbot:backlog-todos-added', {
          detail: createdTodos.map((todo) => todo.id),
        }),
      )
      setCreatedTodoIds(createdTodos.map((todo) => todo.id))
    } catch (error) {
      setRequestError(getErrorMessage(error))
    }
  }

  const selectedCount = drafts?.filter((draft) => draft.selected).length ?? 0
  const selectedPoints = useMemo(
    () => drafts?.reduce((sum, draft) => sum + (draft.selected ? draft.storyPoints ?? 0 : 0), 0) ?? 0,
    [drafts],
  )
  const allSelected = Boolean(drafts?.length && selectedCount === drafts.length)
  if (createdTodoIds) {
    return (
      <div className="grid flex-1 content-center justify-items-center gap-4 p-6 text-center">
        <span className="grid size-12 place-content-center rounded-full bg-success/10 text-success">
          <Check aria-hidden="true" className="size-6" />
        </span>
        <div className="grid gap-1">
          <h2 className="font-heading text-heading font-semibold text-ink">
            {createdTodoIds.length} {createdTodoIds.length === 1 ? 'todo added' : 'todos added'} to the backlog
          </h2>
          <p className="text-small text-muted">You can keep working here or view the new todos in the backlog.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={() => onViewBacklog(createdTodoIds)}>
            View in Backlog
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <section className="grid shrink-0 items-start gap-3 md:grid-cols-[minmax(0,1fr)_8.5rem]">
          <Field
            id="generate-prompt"
            label="Goal"
            error={promptError}
          >
            <TextArea
              id="generate-prompt"
              rows={3}
              maxLength={2000}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={'Describe the feature…'}
              invalid={Boolean(promptError)}
            />
          </Field>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 md:grid-cols-1">
            <Field id="generate-count" label="Count (optional)" error={countError}>
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
            <Button
              variant="primary"
              className="self-end"
              loading={ai.isPending}
              disabled={todos.isPending}
              leadingIcon={<Bot aria-hidden="true" className="size-4" />}
              onClick={() => void generate()}
            >
              Generate
            </Button>
          </div>
          <p className="text-caption text-muted md:col-span-2">
            Drafts are not saved until you add them.
          </p>
        </section>

        {requestError && (
          <AiErrorState
            message={requestError}
            onRetry={() => void (errorAction === 'add' ? addSelected() : generate())}
          />
        )}

        {drafts && (
          <section className="flex min-h-0 flex-1 flex-col gap-2 border-t border-line pt-3">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <h2 className="text-small font-medium text-ink">
                Suggested todos{drafts ? ` (${drafts.length})` : ''}
              </h2>
              {drafts && drafts.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleAllDrafts(!allSelected)}
                  className="text-small text-muted hover:text-ink"
                >
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>
            {drafts && drafts.length > 0 && (
              <div className="hidden shrink-0 gap-3 px-[9px] text-caption text-muted lg:grid lg:draft-grid">
                <span className="size-4" />
                <span>Title</span>
                <span>Type</span>
                <span>Priority</span>
                <span>Points</span>
              </div>
            )}
            <div className="relative min-h-0 flex-1">
              <div ref={draftsScrollRef} className="absolute inset-0 overflow-y-auto pe-1">
                <div className="space-y-2">
                {drafts.length === 0 ? (
                  <EmptyState
                    title="No todo drafts were generated"
                    description="Try generating again with a more specific description."
                  />
                ) : (
                  drafts?.map((draft, index) => (
                    <article
                      key={draft.id}
                      className="grid gap-3 rounded-sm border border-line bg-sunken/50 p-2 lg:draft-grid"
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
                        <p className="text-small text-muted lg:col-start-2 lg:col-end-6">
                          {draft.description}
                        </p>
                      )}
                    </article>
                  ))
                )}
                </div>
              </div>
              {scrollEdges.top && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-surface/85 via-surface/60 to-transparent backdrop-blur-[1px]"
                />
              )}
              {scrollEdges.bottom && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-b from-transparent via-surface/60 to-surface/85 backdrop-blur-[1px]"
                />
              )}
            </div>
          </section>
        )}

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          {drafts ? (
            <p className="text-caption text-muted">
              {selectedPoints} pts total · AI can make mistakes. Review before saving.
            </p>
          ) : (
            <p className="text-caption text-muted">AI can make mistakes. Review before saving.</p>
          )}
          <div className="ms-auto flex justify-end gap-2">
            <Button onClick={onClose}>Close</Button>
            {drafts && (
              <Button
                variant="primary"
                disabled={!selectedCount || ai.isPending}
                loading={todos.isPending}
                leadingIcon={<Check aria-hidden="true" className="size-4" />}
                onClick={() => void addSelected()}
              >
                Add {selectedCount} selected to backlog
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
