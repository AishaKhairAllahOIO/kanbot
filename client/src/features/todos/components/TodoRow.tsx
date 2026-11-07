import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  GripVertical,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import type { Sprint, Todo, MoveTodoRequest } from "@/shared/types/api";
import {
  DueDateBadge,
  PointsPill,
  PriorityBadge,
  TypeBadge,
} from "@/features/todos/components/badges";
import { LabelBadge } from "@/features/todos/components/labels";
import { useLayoutStore } from "@/app/layouts/AppLayout/store/layoutStore";
import { buildTodoEstimatePrompt } from "@/features/ai/utils/todoPrompts";

interface TodoRowProps {
  todo: Todo;
  siblings: Todo[];
  sprints: Sprint[];
  canReorder: boolean;
  listId: string;
  itemIds: string[];
  isSelected?: boolean;
  isNewlyAdded?: boolean;
  onToggleSelect?: (todoId: string) => void;
  onOpen: (todoId: string) => void;
  onMove: (todoId: string, body: MoveTodoRequest) => void;
  onDelete: (todo: Todo) => void;
}

export function TodoRowPreview({ todo }: { todo: Todo }) {
  return (
    <div
      aria-hidden="true"
      className="theme-card flex min-h-11 w-full min-w-0 items-center gap-2 rounded-sm border border-brand/40 bg-raised px-2 text-body shadow-pop"
    >
      <span className="size-4 shrink-0 rounded-xs border border-line-strong" />
      <span className="grid size-6 shrink-0 place-content-center text-subtle">
        <GripVertical className="size-4" />
      </span>
      <span className="min-w-0 shrink-0 truncate font-mono text-key text-muted">
        {todo.key}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium text-ink">
        {todo.title}
      </span>
      {todo.dueDate && (
        <DueDateBadge
          dueDate={todo.dueDate}
          status={todo.status}
          className="hidden sm:inline-flex"
        />
      )}
      {todo.labels && todo.labels.length > 0 && (
        <div className="hidden items-center gap-1 xl:flex">
          {todo.labels.slice(0, 2).map((label) => (
            <LabelBadge key={label} projectId={todo.projectId} label={label} />
          ))}
          {todo.labels.length > 2 && (
            <span className="text-caption text-muted">
              +{todo.labels.length - 2}
            </span>
          )}
        </div>
      )}
      <span className="hidden w-[4.5rem] shrink-0 items-center justify-center sm:inline-flex">
        <TypeBadge type={todo.type} />
      </span>
      <span className="hidden w-[4.5rem] shrink-0 items-center justify-center sm:inline-flex">
        <PriorityBadge priority={todo.priority} />
      </span>
      <span className="inline-flex min-w-9 shrink-0 items-center justify-center">
        <PointsPill todo={todo} />
      </span>
      <span className="grid size-8 shrink-0 place-content-center text-muted">
        <MoreHorizontal className="size-4" />
      </span>
    </div>
  );
}

export function TodoRow({
  todo,
  siblings,
  sprints,
  canReorder,
  listId,
  itemIds,
  isSelected = false,
  isNewlyAdded = false,
  onToggleSelect,
  onOpen,
  onMove,
  onDelete,
}: TodoRowProps) {
  const requestAssistantPrompt = useLayoutStore(
    (state) => state.requestAssistantPrompt,
  );
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    data: { listId, itemIds, todoKey: todo.key, todo },
    disabled: !canReorder,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: `${transition ?? "transform 200ms var(--ease)"}, background-color 350ms var(--ease), box-shadow 350ms var(--ease)`,
    opacity: isDragging ? 0.4 : 1,
    backgroundColor: isNewlyAdded ? "var(--brand-soft)" : undefined,
    boxShadow: isNewlyAdded ? "inset 4px 0 0 var(--brand)" : undefined,
  };
  const position = siblings.findIndex((sibling) => sibling.id === todo.id);
  const canMoveUp = canReorder && position > 0;
  const canMoveDown =
    canReorder && position >= 0 && position < siblings.length - 1;
  const otherSprints = sprints.filter(
    (sprint) => sprint.status === "planned" || sprint.status === "active",
  );
  const selectedRowClass =
    listId === "backlog"
      ? "bg-brand-soft/50 hover:bg-brand-soft focus-within:bg-brand-soft"
      : "bg-info/5 hover:bg-info/10 focus-within:bg-info/10";

  return (
    <div
      ref={setNodeRef}
      data-todo-id={todo.id}
      style={style}
      onClick={() => onOpen(todo.id)}
      className={`group flex min-h-11 w-full min-w-0 cursor-pointer items-center gap-2 px-2 text-body transition-colors ${
        isNewlyAdded
          ? ""
          : isSelected
          ? selectedRowClass
          : "hover:bg-brand-soft/40 focus-within:bg-brand-soft/40"
      }`}
    >
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(event) => {
            event.stopPropagation();
            onToggleSelect(todo.id);
          }}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Select ${todo.key}`}
          className={`size-4 shrink-0 rounded-xs border-line-strong ${
            listId === "backlog"
              ? "accent-brand"
              : "accent-info"
          }`}
        />
      )}
      <button
        type="button"
        aria-label={`Reorder ${todo.key}; use arrow keys to move one step`}
        aria-keyshortcuts="ArrowUp ArrowDown"
        title={
          canReorder
            ? "Drag to reorder or use the arrow keys to move one step"
            : "Clear filters to reorder"
        }
        disabled={!canReorder}
        {...attributes}
        {...listeners}
        onKeyDown={(event) => {
          listeners?.onKeyDown?.(event);
          if (
            isDragging ||
            !canReorder ||
            (event.key !== "ArrowUp" && event.key !== "ArrowDown")
          )
            return;
          event.preventDefault();
          event.stopPropagation();
          const nextPosition = position + (event.key === "ArrowUp" ? -1 : 1);
          if (nextPosition >= 0 && nextPosition < siblings.length) {
            onMove(todo.id, { position: nextPosition });
          }
        }}
        onClick={(event) => event.stopPropagation()}
        className="grid size-13 shrink-0 place-content-center rounded-sm text-subtle hover:bg-brand-soft/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 sm:size-6"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
      <span className="min-w-0 truncate font-mono text-key text-muted">
        {todo.key}
      </span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpen(todo.id);
        }}
        className="min-w-0 flex-1 truncate text-left font-medium text-ink"
        title={todo.title}
      >
        {todo.title}
      </button>

      {/* Due date badge */}
      {todo.dueDate && (
        <DueDateBadge
          dueDate={todo.dueDate}
          status={todo.status}
          className="hidden sm:inline-flex"
        />
      )}

      {/* Labels */}
      {todo.labels && todo.labels.length > 0 && (
        <div className="hidden items-center gap-1 xl:flex">
          {todo.labels.slice(0, 2).map((label) => (
            <LabelBadge key={label} projectId={todo.projectId} label={label} />
          ))}
          {todo.labels.length > 2 && (
            <span className="text-caption text-muted">
              +{todo.labels.length - 2}
            </span>
          )}
        </div>
      )}

      <span className="hidden w-[4.5rem] shrink-0 items-center justify-center sm:inline-flex">
        <TypeBadge type={todo.type} />
      </span>
      <span className="hidden w-[4.5rem] shrink-0 items-center justify-center sm:inline-flex">
        <PriorityBadge priority={todo.priority} />
      </span>
      <span className="inline-flex min-w-9 shrink-0 items-center justify-center">
        <PointsPill todo={todo} />
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
            className="z-popover rounded-md border border-line bg-raised p-1 shadow-pop"
            onClick={(event) => event.stopPropagation()}
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
                <Bot aria-hidden="true" className="size-4" /> Estimate with
                AI
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
                onSelect={() =>
                  onMove(todo.id, { sprintId: null, position: 0 })
                }
              >
                Move to backlog
              </DropdownMenu.Item>
            )}
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
      {!canReorder && <span className="sr-only">Clear filters to reorder</span>}
    </div>
  );
}
