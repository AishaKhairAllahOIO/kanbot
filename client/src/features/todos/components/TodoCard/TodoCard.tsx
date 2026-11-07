import type { TouchEventHandler } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bot, GripVertical, MoreHorizontal, Trash2 } from 'lucide-react'
import type { Todo, TodoStatus } from '@/shared/types/api'
import { useLayoutStore } from '@/app/layouts/AppLayout/store/layoutStore'
import { buildTodoEstimatePrompt } from '@/features/ai/utils/todoPrompts'
import { statusNames } from '@/features/todos/config/statusConfig'
import { CardBody } from './CardBody'
import { CardHeader } from './CardHeader'

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
  const requestAssistantPrompt = useLayoutStore(
    (state) => state.requestAssistantPrompt,
  )
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: todo.id,
    })
  const { onTouchStart, ...handleListeners } = listeners ?? {}
  const handleCardTouchStart: TouchEventHandler<HTMLElement> | undefined =
    onTouchStart
      ? (event) => {
          if (enableCardTouchDrag) onTouchStart(event)
        }
      : undefined
  const handleTouchHandleStart:
    | TouchEventHandler<HTMLButtonElement>
    | undefined = onTouchStart
    ? (event) => {
        if (!enableCardTouchDrag) onTouchStart(event)
      }
    : undefined

  return (
    <article
      ref={setNodeRef}
      onClick={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest('button, a, input, select, textarea, [role="menuitem"]')
        ) {
          return
        }
        onOpen(todo.id)
      }}
      onTouchStart={handleCardTouchStart}
      data-dragging={isDragging || undefined}
      data-done-flash={isDoneFlash || undefined}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="theme-card theme-card-interactive board-card group relative cursor-pointer p-3"
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
                  className="z-popover rounded-md border border-line bg-raised p-1 shadow-pop"
                >
                  <DropdownMenu.Item
                    className="menu-item"
                    onSelect={() => onOpen(todo.id)}
                  >
                    Open
                  </DropdownMenu.Item>
                  {todo.storyPoints === null && (
                    <DropdownMenu.Item
                      className="menu-item"
                      onSelect={() =>
                        requestAssistantPrompt(
                          todo.projectId,
                          buildTodoEstimatePrompt(todo),
                          { todoId: todo.id, key: todo.key },
                        )
                      }
                    >
                      <Bot aria-hidden="true" className="size-4" />{' '}
                      Estimate with AI
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger className="menu-item">
                      Move to
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.SubContent className="z-popover rounded-md border border-line bg-raised p-1 shadow-pop">
                        {(Object.keys(statusNames) as TodoStatus[]).map(
                          (status) => (
                            <DropdownMenu.Item
                              key={status}
                              className="menu-item"
                              disabled={todo.status === status}
                              onSelect={() => onMove(todo.id, status)}
                            >
                              {statusNames[status]}
                            </DropdownMenu.Item>
                          ),
                        )}
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
