import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { PlanSprintResponse, Todo } from '../../../shared/types/api'
import { getErrorMessage } from '../../../shared/api/errors'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Field, TextInput } from '../../../shared/components/Field'
import { Modal } from '../../../shared/components/Modal'
import { Skeleton } from '../../../shared/components/Skeleton'
import { useTodos } from '../../todos/hooks/useTodos'
import { useCreateSprint } from '../../sprints/hooks/useCreateSprint'
import { getSprintTemplate } from '../../sprints/utils/sprintTemplates'
import { usePlanSprint } from '../hooks/usePlanSprint'
import { planSprintSchema } from '../schemas/ai.schemas'
import { AiChip } from './AiChip'
import { AiErrorState } from './AiErrorState'

interface PlanSprintDialogProps {
  open: boolean
  projectId: string
  onOpenChange: (open: boolean) => void
}

export function PlanSprintDialog({ open, projectId, onOpenChange }: PlanSprintDialogProps) {
  const [capacity, setCapacity] = useState(() => getSprintTemplate(projectId).defaultCapacity)
  const [focus, setFocus] = useState('')
  const [capacityError, setCapacityError] = useState('')
  const [plan, setPlan] = useState<PlanSprintResponse | null>(null)
  const [goal, setGoal] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const ai = usePlanSprint(projectId)
  const sprintMutations = useCreateSprint(projectId)
  const backlogQuery = useTodos(projectId, { sprintId: 'backlog' })
  const backlog = backlogQuery.data?.todos
  const todos = useMemo(() => backlog ?? [], [backlog])

  async function suggestPlan() {
    setError('')
    setCapacityError('')
    const validation = planSprintSchema.safeParse({ capacity, focus })
    if (!validation.success) {
      setCapacityError(validation.error.issues[0]?.message ?? 'Check the sprint capacity.')
      return
    }

    try {
      const response = await ai.mutateAsync(validation.data)
      setPlan(response)
      setGoal(response.goal)
      setSelectedIds(response.todoIds)
    } catch (cause) {
      setError(getErrorMessage(cause))
    }
  }

  const selectedTodos = useMemo(
    () => todos.filter((todo) => selectedIds.includes(todo.id)),
    [todos, selectedIds],
  )
  const selectedPoints = selectedTodos.reduce(
    (sum, todo) => sum + (todo.storyPoints ?? 0),
    0,
  )
  const overCapacity = Boolean(plan && selectedPoints > capacity)
  const selectedCount = selectedTodos.length

  function toggleTodo(todo: Todo) {
    setSelectedIds((ids) =>
      ids.includes(todo.id) ? ids.filter((id) => id !== todo.id) : [...ids, todo.id],
    )
  }

  async function createSprint() {
    setError('')
    try {
      await sprintMutations.mutateAsync({
        goal,
        todoIds: selectedTodos.map((todo) => todo.id),
      })
      onOpenChange(false)
    } catch (cause) {
      setError(getErrorMessage(cause))
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setCapacity(getSprintTemplate(projectId).defaultCapacity)
      setFocus('')
      setCapacityError('')
      setPlan(null)
      setGoal('')
      setSelectedIds([])
      setError('')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Plan a sprint"
      description="Choose capacity and focus, then review the suggested plan."
      size="wide"
    >
      {ai.isPending && !plan ? (
        <div className="grid gap-4" role="status" aria-label="Generating sprint plan">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="ms-auto h-8 w-14" />
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid gap-1">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 py-2">
                <Skeleton className="size-4" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
          <Skeleton className="h-16 w-full" />
          <footer className="flex justify-end gap-2 border-t border-line pt-4">
            <Button onClick={() => handleOpenChange(false)}>Cancel</Button>
          </footer>
        </div>
      ) : !plan ? (
        <div className="grid gap-4">
          {error && <AiErrorState message={error} onRetry={() => void suggestPlan()} />}
          <Field
            id="plan-capacity"
            label="Capacity"
            helperText="Story points available in this sprint (1–200)."
            error={capacityError}
          >
            <div className="flex items-center gap-2">
              <TextInput
                id="plan-capacity"
                type="number"
                min={1}
                max={200}
                value={capacity}
                onChange={(event) => setCapacity(Number(event.target.value))}
                invalid={Boolean(capacityError)}
              />
              <span className="text-small text-muted">pts</span>
            </div>
          </Field>
          <Field id="plan-focus" label="Focus" optional>
            <TextInput
              id="plan-focus"
              maxLength={300}
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
            />
          </Field>
          <p className="rounded-sm border border-brand-soft-line bg-brand-soft p-3 text-small text-muted">
            AI can make mistakes. Review before saving.
          </p>
          <footer className="flex justify-end gap-2 border-t border-line pt-4">
            <Button onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button
              variant="primary"
              leadingIcon={<Sparkles aria-hidden="true" className="size-4" />}
              loading={ai.isPending}
              onClick={() => void suggestPlan()}
            >
              Suggest plan
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
                setPlan(null)
                setError('')
              }}
            >
              Back
            </Button>
          </div>
          <Field id="plan-goal" label="Sprint goal">
            <TextInput
              id="plan-goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              maxLength={300}
            />
          </Field>
          <div className="flex items-center justify-between gap-3 text-small">
            <span className={overCapacity ? 'text-warning' : 'text-muted'}>
              {selectedPoints} / {capacity} pts · {selectedCount} todos selected
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-sunken"
            role="progressbar"
            aria-valuenow={Math.min(selectedPoints, capacity)}
            aria-valuemax={capacity}
            aria-valuetext={`${selectedPoints} of ${capacity} story points`}
          >
            <div
              className={`h-full rounded-full ${overCapacity ? 'bg-warning' : 'bg-brand'}`}
              style={{ width: `${Math.min((selectedPoints / capacity) * 100, 100)}%` }}
            />
          </div>
          {backlogQuery.isError ? (
            <AiErrorState
              message={getErrorMessage(backlogQuery.error)}
              onRetry={() => void backlogQuery.refetch()}
            />
          ) : backlogQuery.isPending ? (
            <div className="grid gap-1 py-2" role="status" aria-label="Loading backlog todos">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex items-center gap-3 py-2">
                  <Skeleton className="size-4" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : todos.length === 0 ? (
            <EmptyState
              title="Your backlog is empty"
              description="Add a few todos before asking AI to plan a sprint."
            />
          ) : (
            <div className="max-h-64 divide-y divide-line overflow-y-auto border-y border-line">
              {selectedIds
                .map((id) => todos.find((todo) => todo.id === id))
                .filter((todo): todo is Todo => Boolean(todo))
                .map((todo) => (
                  <label
                    key={todo.id}
                    className="flex cursor-pointer items-center gap-3 py-2 text-small"
                  >
                    <input
                      type="checkbox"
                      checked
                      onChange={() => toggleTodo(todo)}
                      className="size-4 accent-brand"
                    />
                    <span className="font-mono text-key text-muted">{todo.key}</span>
                    <span className="min-w-0 flex-1 truncate text-ink">{todo.title}</span>
                    <span className="tabular-nums text-muted">
                      {todo.storyPoints ?? 0} pts
                    </span>
                  </label>
                ))}
              {todos
                .filter((todo) => !selectedIds.includes(todo.id))
                .map((todo) => (
                  <label
                    key={todo.id}
                    className="flex cursor-pointer items-center gap-3 py-2 text-small"
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => toggleTodo(todo)}
                      className="size-4 accent-brand"
                    />
                    <span className="font-mono text-key text-muted">{todo.key}</span>
                    <span className="min-w-0 flex-1 truncate text-ink">{todo.title}</span>
                    <span className="tabular-nums text-muted">
                      {todo.storyPoints ?? 0} pts
                    </span>
                  </label>
                ))}
            </div>
          )}
          <blockquote className="rounded-sm border-l-2 border-brand-soft-line bg-brand-soft p-3 text-small text-muted">
            <div className="mb-1">
              <AiChip />
            </div>
            {plan.reasoning}
          </blockquote>
          {error && <AiErrorState message={error} onRetry={() => void createSprint()} />}
          <p className="text-caption text-muted">AI can make mistakes. Review before saving.</p>
          <footer className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            <Button onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={sprintMutations.isPending}
              disabled={
                !selectedIds.length ||
                overCapacity ||
                backlogQuery.isPending ||
                backlogQuery.isError
              }
              onClick={() => void createSprint()}
            >
              Create sprint with {selectedCount} todos
            </Button>
          </footer>
        </div>
      )}
    </Modal>
  )
}
