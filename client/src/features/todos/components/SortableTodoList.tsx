import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { MoveTodoRequest, Sprint, Todo } from '@/shared/types/api'
import { TodoRow } from './TodoRow'

interface SortableTodoListProps {
  todos: Todo[]
  sprints: Sprint[]
  canReorder: boolean
  listId?: string
  manageDragContext?: boolean
  isSelected?: (todoId: string) => boolean
  highlightedTodoIds?: ReadonlySet<string>
  onToggleSelect?: (todoId: string) => void
  onOpen: (todoId: string) => void
  onMove: (todoId: string, body: MoveTodoRequest) => void
  onDelete: (todo: Todo) => void
}

export function SortableTodoList({
  todos,
  sprints,
  canReorder,
  listId = 'local',
  manageDragContext = true,
  isSelected,
  highlightedTodoIds,
  onToggleSelect,
  onOpen,
  onMove,
  onDelete,
}: SortableTodoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const todoIds = todos.map((todo) => todo.id)

  function handleDragEnd(event: DragEndEvent) {
    if (!canReorder || !event.over || event.active.id === event.over.id) return
    const from = todos.findIndex((todo) => todo.id === event.active.id)
    const to = todos.findIndex((todo) => todo.id === event.over?.id)
    if (from < 0 || to < 0) return
    onMove(todos[from].id, { position: to })
  }

  const list = (
    <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
      <div className="divide-y divide-line border-t border-line">
        {todos.map((todo) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            siblings={todos}
            sprints={sprints}
            canReorder={canReorder}
            listId={listId}
            itemIds={todoIds}
            isSelected={isSelected?.(todo.id)}
            isNewlyAdded={highlightedTodoIds?.has(todo.id)}
            onToggleSelect={onToggleSelect}
            onOpen={onOpen}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}
      </div>
    </SortableContext>
  )

  if (!manageDragContext) return list

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up ${todos.find((todo) => todo.id === active.id)?.key ?? active.id}.`,
          onDragOver: ({ active, over }) =>
            over
              ? `Moved ${todos.find((todo) => todo.id === active.id)?.key ?? active.id} over position ${todos.findIndex((todo) => todo.id === over.id) + 1}.`
              : '',
          onDragEnd: ({ active, over }) =>
            over
              ? `Dropped ${todos.find((todo) => todo.id === active.id)?.key ?? active.id} at position ${todos.findIndex((todo) => todo.id === over.id) + 1}.`
              : '',
          onDragCancel: ({ active }) => `Cancelled moving ${todos.find((todo) => todo.id === active.id)?.key ?? active.id}.`,
        },
      }}
    >
      {list}
    </DndContext>
  )
}
