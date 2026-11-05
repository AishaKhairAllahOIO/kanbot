import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowDown, ArrowUp, GripVertical, MoreHorizontal, Sparkles, Trash2 } from 'lucide-react'
import type { Sprint, Todo, MoveTodoRequest } from '../../../shared/types/api'
import { DueDateBadge } from './DueDateBadge'
import { LabelBadge } from './LabelBadge'
import { PriorityBadge, TypeIcon } from '../../../shared/components/StatusIndicators'
import { useLayoutStore } from '../../../app/layouts/AppLayout/store/layoutStore'
import { buildTodoEstimatePrompt } from '../../ai/utils/todoPrompts'

const typeChipStyles = {
  task: 'bg-type-task/10 text-type-task',
  story: 'bg-type-story/10 text-type-story',
  bug: 'bg-type-bug/10 text-type-bug',
} as const
const typeLabels = { task: 'Task', story: 'Story', bug: 'Bug' } as const

const priorityChipStyles = {
  low: 'bg-priority-low/10 text-priority-low',
  medium: 'bg-priority-medium/10 text-priority-medium',
  high: 'bg-priority-high/10 text-priority-high',
  urgent: 'bg-priority-urgent/10 text-priority-urgent',
} as const

interface TodoRowProps {
  todo: Todo
  siblings: Todo[]
  sprints: Sprint[]
  canReorder: boolean
  listId: string
  itemIds: string[]
  isSelected?: boolean
  onToggleSelect?: (todoId: string) => void
  onOpen: (todoId: string) => void
  onMove: (todoId: string, body: MoveTodoRequest) => void
  onDelete: (todo: Todo) => void
}

export function TodoRow({
  todo,
  siblings,
  sprints,
  canReorder,
  listId,
  itemIds,
  isSelected = false,
  onToggleSelect,
  onOpen,
  onMove,
  onDelete,
}: TodoRowProps) {
  const requestAssistantPrompt = useLayoutStore((state) => state.requestAssistantPrompt)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    data: { listId, itemIds, todoKey: todo.key, todo },
    disabled: !canReorder,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  const position = siblings.findIndex((sibling) => sibling.id === todo.id)
  const canMoveUp = canReorder && position > 0
  const canMoveDown = canReorder && position >= 0 && position < siblings.length - 1
  const otherSprints = sprints.filter((sprint) => sprint.status === 'planned' || sprint.status === 'active')

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(todo.id)}
      className={`group flex min-h-11 w-full min-w-0 cursor-pointer items-center gap-2 px-2 text-body transition-colors ${
        isSelected
          ? 'bg-info/5 hover:bg-info/10 focus-within:bg-info/10'
          : 'hover:bg-brand-soft/40 focus-within:bg-brand-soft/40'
      }`}
    >
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(event) => {
            event.stopPropagation()
            onToggleSelect(todo.id)
          }}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Select ${todo.key}`}
          className="size-4 shrink-0 rounded-xs border-line-strong accent-info focus:ring-info"
        />
      )}
      <button
        type="button"
        aria-label={`Reorder ${todo.key}; use arrow keys to move one step`}
        aria-keyshortcuts="ArrowUp ArrowDown"
        title={canReorder ? 'Drag to reorder or use the arrow keys to move one step' : 'Clear filters to reorder'}
        disabled={!canReorder}
        {...attributes}
        {...listeners}
        onKeyDown={(event) => {
          listeners?.onKeyDown?.(event)
          if (isDragging || !canReorder || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
          event.preventDefault()
          event.stopPropagation()
          const nextPosition = position + (event.key === 'ArrowUp' ? -1 : 1)
          if (nextPosition >= 0 && nextPosition < siblings.length) {
            onMove(todo.id, { position: nextPosition })
          }
        }}
        onClick={(event) => event.stopPropagation()}
        className="grid size-13 shrink-0 place-content-center rounded-sm text-subtle hover:bg-brand-soft/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 sm:size-6"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
      <span className="min-w-0 truncate font-mono text-key text-muted">{todo.key}</span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onOpen(todo.id)
        }}
        className="min-w-0 flex-1 truncate text-left font-medium text-ink"
        title={todo.title}
      >
        {todo.title}
      </button>

      {/* Due date badge */}
      {todo.dueDate && (
        <DueDateBadge dueDate={todo.dueDate} status={todo.status} className="hidden sm:inline-flex" />
      )}

      {/* Labels */}
      {todo.labels && todo.labels.length > 0 && (
        <div className="hidden items-center gap-1 xl:flex">
          {todo.labels.slice(0, 2).map((label) => (
            <LabelBadge key={label} projectId={todo.projectId} label={label} />
          ))}
          {todo.labels.length > 2 && (
            <span className="text-caption text-muted">+{todo.labels.length - 2}</span>
          )}
        </div>
      )}

      <span className={`hidden w-[4.5rem] shrink-0 items-center justify-center gap-1.5 rounded-full px-2 py-1 text-caption font-medium sm:inline-flex ${typeChipStyles[todo.type]}`}>
        <TypeIcon type={todo.type} />
        {typeLabels[todo.type]}
      </span>
      <span className={`hidden w-[4.5rem] shrink-0 items-center justify-center rounded-full px-2 py-1 sm:inline-flex ${priorityChipStyles[todo.priority]}`}>
        <PriorityBadge priority={todo.priority} showLabel />
      </span>
      <span
        className="inline-flex min-w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft px-2 py-1 text-caption font-medium tabular-nums text-brand-ink"
        title={todo.storyPoints === null ? 'Not estimated' : `${todo.storyPoints} story points`}
      >
        {todo.storyPoints === null ? '–' : `${todo.storyPoints} pts`}
      </span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={`Actions for ${todo.key}`}
            onClick={(event) => event.stopPropagation()}
            className="grid size-13 shrink-0 place-content-center rounded-sm text-muted hover:bg-brand-soft/40 hover:text-ink sm:size-8"
          >
            <MoreHorizontal aria-hidden="true" className="size-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-popover min-w-48 rounded-md border border-line bg-raised p-1 shadow-pop"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenu.Item className="menu-item" onSelect={() => onOpen(todo.id)}>Open</DropdownMenu.Item>
            {todo.storyPoints === null && (
              <DropdownMenu.Item
                className="menu-item"
                onSelect={() => requestAssistantPrompt(todo.projectId, buildTodoEstimatePrompt(todo))}
              >
                <Sparkles aria-hidden="true" className="size-4" /> Estimate with AI
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Item
              className="menu-item"
              disabled={!canMoveUp}
              onSelect={() => onMove(todo.id, { position: position - 1 })}
            >
              <ArrowUp aria-hidden="true" className="size-4" /> Move up
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="menu-item"
              disabled={!canMoveDown}
              onSelect={() => onMove(todo.id, { position: position + 1 })}
            >
              <ArrowDown aria-hidden="true" className="size-4" /> Move down
            </DropdownMenu.Item>
            {otherSprints.map((sprint) => (
              <DropdownMenu.Item
                key={sprint.id}
                className="menu-item"
                disabled={sprint.id === todo.sprintId}
                onSelect={() =>
                  onMove(todo.id, {
                    sprintId: sprint.id,
                    status: todo.status,
                    position: sprint.stats.byStatus[todo.status],
                  })
                }
              >
                Move to {sprint.name}
              </DropdownMenu.Item>
            ))}
            {todo.sprintId && (
              <DropdownMenu.Item
                className="menu-item"
                onSelect={() => onMove(todo.id, { sprintId: null, position: 0 })}
              >
                Move to backlog
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Separator className="my-1 h-px bg-line" />
            <DropdownMenu.Item className="menu-item text-danger" onSelect={() => onDelete(todo)}>
              <Trash2 aria-hidden="true" className="size-4" /> Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {!canReorder && <span className="sr-only">Clear filters to reorder</span>}
    </div>
  )
}
