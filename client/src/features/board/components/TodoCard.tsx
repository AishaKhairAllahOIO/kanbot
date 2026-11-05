import type { ReactNode, TouchEventHandler } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  Bookmark,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  Equal,
  GripVertical,
  MoreHorizontal,
  Sparkles,
  SquareCheck,
  Trash2,
} from 'lucide-react'
import type { Todo, TodoStatus, TodoType, TodoPriority } from '../../../shared/types/api'
import { DueDateBadge } from '../../todos/components/DueDateBadge'
import { LabelBadge } from '../../todos/components/LabelBadge'
import { useLayoutStore } from '../../../app/layouts/AppLayout/store/layoutStore'
import { buildTodoEstimatePrompt } from '../../ai/utils/todoPrompts'

const typeConfig: Record<TodoType, { label: string; icon: typeof SquareCheck; color: string }> = {
  task: { label: 'Task', icon: SquareCheck, color: 'var(--type-task)' },
  story: { label: 'Story', icon: Bookmark, color: 'var(--type-story)' },
  bug: { label: 'Bug', icon: Bug, color: 'var(--type-bug)' },
}

const priorityConfig: Record<
  TodoPriority,
  { label: string; icon: typeof ChevronDown; color: string; className: string }
> = {
  low: {
    label: 'Low',
    icon: ChevronDown,
    color: 'var(--priority-low)',
    className: 'text-priority-low',
  },
  medium: {
    label: 'Medium',
    icon: Equal,
    color: 'var(--priority-medium)',
    className: 'text-priority-medium',
  },
  high: {
    label: 'High',
    icon: ChevronUp,
    color: 'var(--priority-high)',
    className: 'text-priority-high',
  },
  urgent: {
    label: 'Urgent',
    icon: ChevronsUp,
    color: 'var(--priority-urgent)',
    className: 'text-priority-urgent',
  },
}

const statusNames: Record<TodoStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

function TypeBadge({ type }: { type: TodoType }) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-xs px-1.5 py-0.5 text-caption font-medium"
      style={{
        backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
        color: config.color,
      }}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {config.label}
    </span>
  )
}

function PointsPill({ todo }: { todo: Todo }) {
  return (
    <span
      className="shrink-0 rounded-full bg-sunken px-2 py-0.5 text-caption tabular-nums text-muted"
      title={todo.storyPoints === null ? 'Not estimated' : `${todo.storyPoints} story points`}
    >
      {todo.storyPoints === null ? '–' : `${todo.storyPoints} pts`}
    </span>
  )
}

function CardHeader({ todo, actions }: { todo: Todo; actions?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <TypeBadge type={todo.type} />
      <span className="min-w-0 truncate font-mono text-key text-muted">{todo.key}</span>
      <span className="flex-1" />
      <PointsPill todo={todo} />
      {actions}
    </div>
  )
}

function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const config = priorityConfig[priority]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xs px-2 py-0.5 text-caption font-medium ${config.className}`}
      style={{ backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)` }}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {config.label}
    </span>
  )
}

function CardBody({ todo, onOpen }: { todo: Todo; onOpen?: () => void }) {
  return (
    <>
      <div className="mt-2 flex items-start gap-1.5">
        {todo.status === 'done' && (
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-status-done" />
        )}
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="line-clamp-3 min-w-0 flex-1 text-left text-body font-medium text-ink"
            title={todo.title}
          >
            {todo.title}
          </button>
        ) : (
          <p className="line-clamp-3 min-w-0 flex-1 text-body font-medium text-ink">{todo.title}</p>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={todo.priority} />
        {todo.dueDate && (
          <DueDateBadge dueDate={todo.dueDate} status={todo.status} />
        )}
        {todo.labels && todo.labels.map((label) => (
          <LabelBadge key={label} projectId={todo.projectId} label={label} />
        ))}
      </div>
    </>
  )
}

export function TodoCardPreview({ todo, className = '' }: { todo: Todo; className?: string }) {
  return (
    <article
      className={`theme-card board-card w-full border-brand p-3 shadow-modal ${className}`}
    >
      <CardHeader todo={todo} />
      <CardBody todo={todo} />
    </article>
  )
}

interface TodoCardProps {
  todo: Todo
  onOpen: (todoId: string) => void
  onMove: (todoId: string, status: TodoStatus) => void
  onDelete: (todo: Todo) => void
  isDragging: boolean
  enableCardTouchDrag: boolean
  isDoneFlash?: boolean
}

export function TodoCard({
  todo,
  onOpen,
  onMove,
  onDelete,
  isDragging,
  enableCardTouchDrag,
  isDoneFlash = false,
}: TodoCardProps) {
  const requestAssistantPrompt = useLayoutStore((state) => state.requestAssistantPrompt)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: todo.id,
  })
  const { onTouchStart, ...handleListeners } = listeners ?? {}
  const handleCardTouchStart: TouchEventHandler<HTMLElement> | undefined = onTouchStart
    ? (event) => {
        if (enableCardTouchDrag) onTouchStart(event)
      }
    : undefined
  const handleTouchHandleStart: TouchEventHandler<HTMLButtonElement> | undefined = onTouchStart
    ? (event) => {
        if (!enableCardTouchDrag) onTouchStart(event)
      }
    : undefined

  return (
    <article
      ref={setNodeRef}
      onTouchStart={handleCardTouchStart}
      data-dragging={isDragging || undefined}
      data-done-flash={isDoneFlash || undefined}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="theme-card theme-card-interactive board-card group relative p-3"
    >
      <CardHeader
        todo={todo}
        actions={
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  aria-label={`More actions for ${todo.key}`}
                  className="rounded-xs p-1 text-muted hover:bg-sunken hover:text-ink"
                >
                  <MoreHorizontal aria-hidden="true" className="size-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  className="z-popover min-w-40 rounded-md border border-line bg-raised p-1 shadow-pop"
                >
                  <DropdownMenu.Item className="menu-item" onSelect={() => onOpen(todo.id)}>
                    Open
                  </DropdownMenu.Item>
                  {todo.storyPoints === null && (
                    <DropdownMenu.Item
                      className="menu-item"
                      onSelect={() => requestAssistantPrompt(todo.projectId, buildTodoEstimatePrompt(todo))}
                    >
                      <Sparkles aria-hidden="true" className="size-4" /> Estimate with AI
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger className="menu-item">Move to</DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.SubContent className="z-popover min-w-36 rounded-md border border-line bg-raised p-1 shadow-pop">
                        {(Object.keys(statusNames) as TodoStatus[]).map((status) => (
                          <DropdownMenu.Item
                            key={status}
                            className="menu-item"
                            disabled={todo.status === status}
                            onSelect={() => onMove(todo.id, status)}
                          >
                            {statusNames[status]}
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>
                  <DropdownMenu.Separator className="my-1 h-px bg-line" />
                  <DropdownMenu.Item
                    className="menu-item text-danger"
                    onSelect={() => onDelete(todo)}
                  >
                    <Trash2 aria-hidden="true" className="size-4" /> Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <button
              type="button"
              aria-label={`Delete ${todo.key}`}
              onClick={() => onDelete(todo)}
              className="rounded-xs p-1 text-muted hover:bg-sunken hover:text-danger"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              aria-label={`Drag ${todo.key}`}
              {...attributes}
              {...handleListeners}
              onTouchStart={handleTouchHandleStart}
              className="cursor-grab rounded-xs p-1 text-muted hover:bg-sunken active:cursor-grabbing"
            >
              <GripVertical aria-hidden="true" className="size-4" />
            </button>
          </div>
        }
      />
      <CardBody todo={todo} onOpen={() => onOpen(todo.id)} />
    </article>
  )
}
