import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, format } from 'date-fns'
import { ArrowDown, ArrowUp, Bot } from 'lucide-react'
import type { PlanSprintResponse, Sprint, Todo } from '../../../shared/types/api'
import { getErrorMessage } from '../../../shared/api/errors'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Field, SelectInput, TextInput } from '../../../shared/components/Field'
import { Spinner } from '../../../shared/components/Spinner'
import { useTodos } from '../../todos/hooks/useTodos'
import { useCreateSprint } from '../../sprints/hooks/useCreateSprint'
import { getSprintTemplate } from '../../sprints/utils/sprintTemplates'
import { usePlanSprint } from '../hooks/usePlanSprint'
import { planSprintSchema } from '../schemas/ai.schemas'
import { AiErrorState } from './AiErrorState'

interface PlanSprintContentProps {
  projectId: string
  onClose: () => void
  onViewBacklog: (sprintId: string) => void
}

interface ScrollEdges {
  top: boolean
  bottom: boolean
}

const noScrollEdges: ScrollEdges = { top: false, bottom: false }

export function PlanSprintContent({ projectId, onClose, onViewBacklog }: PlanSprintContentProps) {
  const [capacity, setCapacity] = useState(() => getSprintTemplate(projectId).defaultCapacity)
  const [lengthDays, setLengthDays] = useState(() => getSprintTemplate(projectId).defaultLengthDays)
  const [focus, setFocus] = useState('')
  const [capacityError, setCapacityError] = useState('')
  const [plan, setPlan] = useState<PlanSprintResponse | null>(null)
  const [goal, setGoal] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [createdSprint, setCreatedSprint] = useState<Sprint | null>(null)
  const [error, setError] = useState('')
  const [errorAction, setErrorAction] = useState<'suggest' | 'create'>('suggest')
  const [todoScrollEdges, setTodoScrollEdges] = useState(noScrollEdges)
  const todoScrollRef = useRef<HTMLDivElement>(null)
  const ai = usePlanSprint(projectId)
  const sprintMutations = useCreateSprint(projectId)
  const backlogQuery = useTodos(projectId, { sprintId: 'backlog' })
  const backlog = backlogQuery.data?.todos
  const todos = useMemo(() => backlog ?? [], [backlog])

  async function suggestPlan() {
    setError('')
    setErrorAction('suggest')
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
    setErrorAction('create')
    try {
      const start = new Date()
      const { sprint } = await sprintMutations.mutateAsync({
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(addDays(start, lengthDays), 'yyyy-MM-dd'),
        goal,
        todoIds: selectedTodos.map((todo) => todo.id),
      })
      setCreatedSprint(sprint)
    } catch (cause) {
      setError(getErrorMessage(cause))
    }
  }

  const visibleTodos = useMemo(() => {
    const suggestedIds = plan?.todoIds ?? []
    return [...todos].sort((first, second) => {
      const firstIndex = suggestedIds.indexOf(first.id)
      const secondIndex = suggestedIds.indexOf(second.id)
      if (firstIndex === -1) return secondIndex === -1 ? 0 : 1
      if (secondIndex === -1) return -1
      return firstIndex - secondIndex
    })
  }, [plan?.todoIds, todos])
  const availableLengths = [...new Set([7, 14, 21, 28, lengthDays])].sort((a, b) => a - b)

  useEffect(() => {
    const scrollElement = todoScrollRef.current
    if (!scrollElement) return

    const updateScrollEdges = () => {
      const top = scrollElement.scrollTop > 0
      const bottom =
        scrollElement.scrollTop + scrollElement.clientHeight < scrollElement.scrollHeight - 1
      setTodoScrollEdges((current) =>
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
  }, [plan, visibleTodos, backlogQuery.isLoading, backlogQuery.isError])

  if (createdSprint) {
    return (
      <div className="grid flex-1 content-center justify-items-center gap-4 p-6 text-center">
        <span className="grid size-12 place-content-center rounded-full bg-success/10 text-success">
          <Bot aria-hidden="true" className="size-6" />
        </span>
        <div className="grid gap-1">
          <h2 className="font-heading text-heading font-semibold text-ink">Sprint created</h2>
          <p className="text-small text-muted">
            {createdSprint.name} is planned. You can view it in the backlog whenever you are ready.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={() => onViewBacklog(createdSprint.id)}>View in Backlog</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="grid shrink-0 gap-x-3 gap-y-2 sm:grid-cols-3 sm:items-start">
          <Field
            id="plan-capacity"
            label="Capacity (Story Points)"
            error={capacityError}
            reserveErrorSpace
          >
            <TextInput
              id="plan-capacity"
              type="number"
              min={1}
              max={200}
              value={capacity}
              onChange={(event) => setCapacity(Number(event.target.value))}
              invalid={Boolean(capacityError)}
            />
          </Field>
          <Field id="plan-length" label="Sprint length">
            <SelectInput
              id="plan-length"
              value={lengthDays}
              onChange={(event) => setLengthDays(Number(event.target.value))}
            >
              {availableLengths.map((days) => (
                <option key={days} value={days}>
                  {days % 7 === 0 ? `${days / 7} week${days === 7 ? '' : 's'}` : `${days} days`}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field
            id="plan-focus"
            label="Planning focus"
            optional
          >
            <TextInput
              id="plan-focus"
              maxLength={300}
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              placeholder="Guide AI task priorities."
            />
          </Field>
          <Button
            className="sm:col-span-3"
            variant="primary"
            leadingIcon={<Bot aria-hidden="true" className="size-4" />}
            loading={ai.isPending}
            disabled={sprintMutations.isPending}
            onClick={() => void suggestPlan()}
          >
            Suggest plan
          </Button>
        </div>
        {error && (
          <AiErrorState
            message={error}
            onRetry={() => void (errorAction === 'create' ? createSprint() : suggestPlan())}
          />
        )}
        {plan && (
          <>
            <Field id="plan-goal" label="Suggested sprint goal">
              <TextInput
                id="plan-goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                maxLength={300}
              />
            </Field>
            <div className="grid min-h-0 flex-1 grid-rows-2 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:grid-rows-1">
              <section
                className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2"
                aria-label="Suggested backlog todos"
              >
                <div className="flex items-center justify-between gap-3 text-small">
                  <h2 className="text-small font-medium text-brand-ink">Selected backlog todos</h2>
                  <span className={`rounded-full px-2 py-0.5 text-caption ${overCapacity ? 'bg-warning/15 text-warning' : 'bg-brand-soft text-brand-ink'}`}>
                    {selectedCount} selected
                  </span>
                </div>
                <div className="relative min-h-0 overflow-hidden rounded-sm border border-brand-soft-line bg-brand-soft/25">
                  <div ref={todoScrollRef} className="scrollbar-hidden h-full min-h-0 overflow-y-auto">
                  {backlogQuery.isError ? (
                    <AiErrorState
                      message={getErrorMessage(backlogQuery.error)}
                      onRetry={() => void backlogQuery.refetch()}
                    />
                  ) : backlogQuery.isLoading ? (
                    <div className="flex justify-center py-4" role="status">
                      <Spinner label="Loading backlog todos" />
                    </div>
                  ) : todos.length === 0 ? (
                    <EmptyState
                      title="Your backlog is empty"
                      description="Add a few todos before asking AI to plan a sprint."
                    />
                  ) : (
                    <div className="divide-y divide-brand-soft-line">
                      {visibleTodos.map((todo) => (
                        <label
                          key={todo.id}
                          className="flex cursor-pointer items-center gap-3 px-2 py-2 text-small odd:bg-brand-soft/25"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(todo.id)}
                            onChange={() => toggleTodo(todo)}
                            className="size-4 accent-brand"
                          />
                          <span className="shrink-0 font-mono text-key text-muted">{todo.key}</span>
                          <span className="min-w-0 flex-1 truncate text-ink">{todo.title}</span>
                          <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 tabular-nums text-caption text-brand-ink">
                            {todo.storyPoints ?? 0} pts
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  </div>
                  {todoScrollEdges.top && (
                    <div className="plan-todo-scroll-fade plan-todo-scroll-fade-top pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center py-1">
                      <button
                        type="button"
                        aria-label="Scroll todos up"
                        onClick={() => todoScrollRef.current?.scrollBy({ top: -140, behavior: 'smooth' })}
                        className="pointer-events-auto relative z-10 grid size-7 place-content-center rounded-full border border-line bg-surface text-brand-ink transition-colors hover:bg-brand-soft"
                      >
                        <ArrowUp aria-hidden="true" className="size-3.5" />
                      </button>
                    </div>
                  )}
                  {todoScrollEdges.bottom && (
                    <div className="plan-todo-scroll-fade plan-todo-scroll-fade-bottom pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center py-1">
                      <button
                        type="button"
                        aria-label="Scroll todos down"
                        onClick={() => todoScrollRef.current?.scrollBy({ top: 140, behavior: 'smooth' })}
                        className="pointer-events-auto relative z-10 grid size-7 place-content-center rounded-full border border-line bg-surface text-brand-ink transition-colors hover:bg-brand-soft"
                      >
                        <ArrowDown aria-hidden="true" className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div className="flex items-center gap-3 rounded-b-sm border border-brand-soft-line bg-brand-soft/70 px-3 py-2 text-small">
                    <span className="shrink-0 font-medium text-brand-ink">Total</span>
                    <div
                      className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-brand-soft-line"
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
                    <span className={`shrink-0 tabular-nums ${overCapacity ? 'text-warning' : 'text-brand-ink'}`}>
                      {selectedPoints} / {capacity} pts
                    </span>
                  </div>
                </div>
              </section>
              <section
                className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2"
                aria-label="Sprint plan reasoning"
              >
                <h2 className="text-small font-medium text-signal-ink">Why this plan?</h2>
                <div className="relative min-h-0 overflow-hidden rounded-sm border border-signal/30 bg-signal/10">
                  <div className="h-full overflow-y-auto p-3 text-small text-ink">
                    <p className="mb-2 font-semibold text-signal-ink">Reasoning (AI)</p>
                    <p className="whitespace-pre-line">{plan.reasoning}</p>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
      <footer className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-caption text-muted">AI can make mistakes. Review before saving.</p>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Close</Button>
          {plan && (
            <Button
              variant="primary"
              loading={sprintMutations.isPending}
              disabled={
                !selectedCount ||
                overCapacity ||
                ai.isPending ||
                backlogQuery.isLoading ||
                backlogQuery.isError
              }
              onClick={() => void createSprint()}
            >
              Create sprint with {selectedCount} todos
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
