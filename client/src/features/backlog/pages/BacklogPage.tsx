import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useParams } from "react-router";
import type { Todo, TodoPriority, TodoType } from "@/shared/types/api";
import { ApiError, getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { Modal } from "@/shared/components/Modal";
import { Skeleton } from "@/shared/components/Skeleton";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useLayoutStore } from "@/app/layouts/AppLayout/store/layoutStore";
import { useUiPreferencesStore } from "@/app/stores/uiPreferencesStore";
import { useTodos } from "@/features/todos/hooks/useTodos";
import { useRemoveTodo, useMoveTodo } from "@/features/todos/hooks";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import { PlannedSprintSection } from "@/features/backlog/components/PlannedSprintSection";
import { Topbar } from "@/app/layouts";
import { BacklogToolbar } from "@/features/backlog/components/BacklogToolbar";
import { BacklogTodoSection } from "@/features/backlog/components/BacklogTodoSection";
import { BulkActionsBar } from "@/features/todos/components/BulkActionsBar";
import { useBulkTodoActions } from "@/features/todos/hooks/useBulkTodoActions";
import {
  exportTodosToCsv,
  exportTodosToMarkdown,
} from "@/features/todos/utils/exportTodos";
import { TodoDetailsDialog } from "@/features/todos/components/TodoDetailsDialog";
import { TodoRowPreview } from "@/features/todos/components/TodoRow";
import { SprintFormDialog } from "@/features/sprints/components/SprintFormDialog";
import { LabelManagementDialog } from "@/features/todos/components/labels";
import { SprintTemplateDialog } from "@/features/sprints/components/SprintTemplateDialog";

interface TodoListDragData {
  listId: string;
  itemIds: string[];
  todoKey?: string;
  todo?: Todo;
}

const listAwareCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const pointerItemCollisions = pointerCollisions.filter(
    ({ id }) => !String(id).startsWith("list:"),
  );
  if (pointerItemCollisions.length > 0) return pointerItemCollisions;
  if (pointerCollisions.length > 0) return pointerCollisions;

  return closestCenter(args);
};

export function BacklogPage() {
  useDocumentTitle("Backlog");
  const { projectId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const stateHighlightTimeout = useRef<number | null>(null);
  const setAiPlanningTab = useLayoutStore((state) => state.setAiPlanningTab);
  const setSectionCollapsed = useUiPreferencesStore((state) => state.setCollapsed);
  const [newlyAddedTodoIds, setNewlyAddedTodoIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [highlightedSprintId, setHighlightedSprintId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<TodoPriority | "">("");
  const [type, setType] = useState<TodoType | "">("");
  const [label, setLabel] = useState("");
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<Todo>();
  const [deleteError, setDeleteError] = useState("");
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [manageLabelsOpen, setManageLabelsOpen] = useState(false);
  const [sprintTemplateOpen, setSprintTemplateOpen] = useState(false);
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null);
  const [draggedTodoWidth, setDraggedTodoWidth] = useState<number | null>(null);

  useEffect(() => {
    let highlightTimeout: number | undefined;

    const handleBacklogTodosAdded = (event: Event) => {
      const todoIds = (event as CustomEvent<unknown>).detail;
      if (!Array.isArray(todoIds) || !todoIds.every((id) => typeof id === "string")) {
        return;
      }

      setSectionCollapsed(`backlog:${projectId}:todos`, false);
      setNewlyAddedTodoIds(new Set(todoIds));
      window.clearTimeout(highlightTimeout);
      highlightTimeout = window.setTimeout(
        () => setNewlyAddedTodoIds(new Set()),
        3200,
      );
    };

    window.addEventListener("kanbot:backlog-todos-added", handleBacklogTodosAdded);
    return () => {
      window.removeEventListener("kanbot:backlog-todos-added", handleBacklogTodosAdded);
      window.clearTimeout(highlightTimeout);
    };
  }, [projectId, setSectionCollapsed]);

  useEffect(() => {
    const state = location.state as {
      highlightTodoIds?: unknown;
      highlightSprintId?: unknown;
    } | null;
    const todoIds = state?.highlightTodoIds;
    const validTodoIds =
      Array.isArray(todoIds) && todoIds.every((id) => typeof id === "string")
        ? todoIds
        : null;
    const sprintId =
      typeof state?.highlightSprintId === "string"
        ? state.highlightSprintId
        : null;
    if (!validTodoIds?.length && !sprintId) {
      return;
    }

    if (validTodoIds?.length) {
      setSectionCollapsed(`backlog:${projectId}:todos`, false);
    }
    if (sprintId) {
      setSectionCollapsed(`backlog:sprint:${sprintId}`, false);
    }
    if (stateHighlightTimeout.current !== null) {
      window.clearTimeout(stateHighlightTimeout.current);
    }
    window.requestAnimationFrame(() => {
      setNewlyAddedTodoIds(new Set(validTodoIds ?? []));
      setHighlightedSprintId(sprintId);
      stateHighlightTimeout.current = window.setTimeout(
        () => {
          setNewlyAddedTodoIds(new Set());
          setHighlightedSprintId(null);
        },
        3200,
      );
    });
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: null,
    });
  }, [location.hash, location.key, location.pathname, location.search, location.state, navigate, projectId, setSectionCollapsed]);

  useEffect(() => () => {
    if (stateHighlightTimeout.current !== null) {
      window.clearTimeout(stateHighlightTimeout.current);
    }
  }, []);

  const debouncedSearch = useDebouncedValue(search);
  const query = {
    sprintId: "backlog" as const,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(priority ? { priority } : {}),
    ...(type ? { type } : {}),
  };
  const todosQuery = useTodos(projectId, query);
  const allTodosQuery = useTodos(projectId, { sprintId: "backlog" });
  const sprintsQuery = useSprints(projectId);
  const todoMove = useMoveTodo(projectId);
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const todoRemove = useRemoveTodo(projectId);
  const bulk = useBulkTodoActions(projectId);

  function openAiPlanningTab(tab: "generate" | "plan") {
    setAiPlanningTab(tab);
  }

  const todos = useMemo(
    () => todosQuery.data?.todos ?? [],
    [todosQuery.data?.todos],
  );
  const allTodos = useMemo(
    () => allTodosQuery.data?.todos ?? [],
    [allTodosQuery.data?.todos],
  );
  const sprints = sprintsQuery.data?.sprints ?? [];
  const plannedSprints = sprints.filter(
    (sprint) => sprint.status === "planned",
  );
  const activeSprint =
    sprints.find((sprint) => sprint.status === "active") ?? null;

  const availableLabels = useMemo(() => {
    const set = new Set<string>();
    allTodos.forEach((t) => t.labels.forEach((l) => set.add(l)));
    return Array.from(set).sort();
  }, [allTodos]);

  const filteredTodos = useMemo(() => {
    if (!label) return todos;
    return todos.filter((todo) => todo.labels.includes(label));
  }, [todos, label]);

  const filtersActive = Boolean(search.trim() || priority || type || label);
  const totalPoints = allTodos.reduce(
    (sum, todo) => sum + (todo.storyPoints ?? 0),
    0,
  );

  function handleCrossListDragEnd(event: DragEndEvent) {
    setDraggedTodo(null);
    setDraggedTodoWidth(null);
    if (!event.over || event.active.id === event.over.id) return;
    const activeData = event.active.data.current as
      | TodoListDragData
      | undefined;
    const overData = event.over.data.current as TodoListDragData | undefined;
    if (!activeData || !overData) return;

    const droppingOnList = String(event.over.id).startsWith("list:");
    const sameList = activeData.listId === overData.listId;
    const overIndex = overData.itemIds.indexOf(String(event.over.id));
    const position = droppingOnList
      ? overData.itemIds.length - Number(sameList)
      : overIndex;
    if (position < 0) return;

    todoMove.mutate({
      todoId: String(event.active.id),
      body: {
        sprintId: overData.listId === "backlog" ? null : overData.listId,
        position,
      },
    });
  }

  async function deleteTodo() {
    if (!deletingTodo) return;
    setDeleteError("");
    try {
      await todoRemove.mutateAsync(deletingTodo.id);
      setDeletingTodo(undefined);
    } catch (error) {
      if (error instanceof ApiError && error.code === "NOT_FOUND") {
        setDeletingTodo(undefined);
        return;
      }
      setDeleteError(getErrorMessage(error));
    }
  }

  function clearFilters() {
    setSearch("");
    setPriority("");
    setType("");
    setLabel("");
  }

  return (
    <section>
      <Topbar
        title="Backlog"
        meta={
          allTodosQuery.isLoading ? (
            <span role="status" aria-label="Loading backlog summary">
              <Skeleton className="h-4 w-24" />
            </span>
          ) : (
            <span className="shrink-0">
              {allTodos.length} todos · {totalPoints} pts
            </span>
          )
        }
      />
      <BacklogToolbar
        search={search}
        setSearch={setSearch}
        priority={priority}
        setPriority={setPriority}
        type={type}
        setType={setType}
        label={label}
        setLabel={setLabel}
        availableLabels={availableLabels}
        onClearFilters={clearFilters}
        onManageLabels={() => setManageLabelsOpen(true)}
        onOpenSprintTemplate={() => setSprintTemplateOpen(true)}
        onExportCsv={() =>
          exportTodosToCsv(allTodos, `${projectId}-backlog.csv`)
        }
        onExportMarkdown={() =>
          exportTodosToMarkdown(
            allTodos,
            `Project Backlog`,
            `${projectId}-backlog.md`,
          )
        }
        onGenerate={() => openAiPlanningTab("generate")}
        onPlanSprint={() => openAiPlanningTab("plan")}
        onCreateSprint={() => setCreateSprintOpen(true)}
      />

      <DndContext
        sensors={dragSensors}
        collisionDetection={listAwareCollisionDetection}
        onDragStart={({ active }) => {
          const data = active.data.current as TodoListDragData | undefined;
          setDraggedTodo(data?.todo ?? null);
          setDraggedTodoWidth(active.rect.current.initial?.width ?? null);
        }}
        onDragEnd={handleCrossListDragEnd}
        onDragCancel={() => {
          setDraggedTodo(null);
          setDraggedTodoWidth(null);
        }}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => {
              const data = active.data.current as TodoListDragData | undefined;
              return `Picked up ${data?.todoKey ?? active.id}.`;
            },
            onDragOver: ({ active, over }) => {
              const data = active.data.current as TodoListDragData | undefined;
              return over ? `Moving ${data?.todoKey ?? active.id}.` : "";
            },
            onDragEnd: ({ active, over }) => {
              const data = active.data.current as TodoListDragData | undefined;
              return over ? `Dropped ${data?.todoKey ?? active.id}.` : "";
            },
            onDragCancel: ({ active }) => {
              setDraggedTodo(null);
              setDraggedTodoWidth(null);
              const data = active.data.current as TodoListDragData | undefined;
              return `Cancelled moving ${data?.todoKey ?? active.id}.`;
            },
          },
        }}
      >
        <div className="page-gutter pb-8 pt-4">
          {todosQuery.isError && (
            <div className="mb-4">
              <EmptyState
                title="Backlog could not be loaded"
                description={getErrorMessage(todosQuery.error)}
                error
                action={
                  <Button onClick={() => void todosQuery.refetch()}>
                    Try again
                  </Button>
                }
              />
            </div>
          )}
          {allTodosQuery.isError && (
            <div className="mb-4">
              <EmptyState
                title="Backlog details could not be loaded"
                description={getErrorMessage(allTodosQuery.error)}
                error
                action={
                  <Button onClick={() => void allTodosQuery.refetch()}>
                    Try again
                  </Button>
                }
              />
            </div>
          )}
          {sprintsQuery.isError && (
            <div className="mb-4">
              <EmptyState
                title="Sprints could not be loaded"
                description={getErrorMessage(sprintsQuery.error)}
                error
                action={
                  <Button onClick={() => void sprintsQuery.refetch()}>
                    Try again
                  </Button>
                }
              />
            </div>
          )}
          {sprintsQuery.isLoading && (
            <div
              className="mb-4 grid gap-3"
              role="status"
              aria-label="Loading planned sprints"
            >
              <SprintSectionSkeleton />
            </div>
          )}
          {plannedSprints.map((sprint) => (
            <PlannedSprintSection
              key={sprint.id}
              projectId={projectId}
              sprint={sprint}
              isHighlighted={highlightedSprintId === sprint.id}
              sprints={sprints}
              activeSprint={activeSprint}
              onOpenTodo={setSelectedTodoId}
              onDeleteTodo={setDeletingTodo}
              isSelected={bulk.isSelected}
              onToggleSelect={bulk.toggle}
              onToggleSelectAll={bulk.toggleAll}
            />
          ))}

          {todosQuery.isLoading ? (
            <BacklogLoadingSkeleton />
          ) : !todosQuery.isError ? (
            <BacklogTodoSection
              highlightedTodoIds={newlyAddedTodoIds}
              projectId={projectId}
              todos={filteredTodos}
              totalTodos={allTodos.length}
              totalPoints={totalPoints}
              summaryLoading={allTodosQuery.isLoading}
              sprints={sprints}
              filtersActive={filtersActive}
              isSelected={bulk.isSelected}
              onToggleSelect={bulk.toggle}
              onToggleSelectAll={() =>
                bulk.toggleAll(filteredTodos.map((t) => t.id))
              }
              isAllSelected={
                filteredTodos.length > 0 &&
                filteredTodos.every((t) => bulk.isSelected(t.id))
              }
              onClearFilters={clearFilters}
              onOpenTodo={setSelectedTodoId}
              onMoveTodo={(todoId, body) => todoMove.mutate({ todoId, body })}
              onDeleteTodo={setDeletingTodo}
              onGenerateTodos={() => openAiPlanningTab("generate")}
            />
          ) : null}
        </div>
        {createPortal(
          <DragOverlay dropAnimation={null}>
            {draggedTodo && (
              <div style={{ width: draggedTodoWidth ?? undefined }}>
                <TodoRowPreview todo={draggedTodo} />
              </div>
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>

      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        sprints={sprints}
        isProcessing={bulk.isProcessing}
        error={bulk.error}
        onClear={bulk.clear}
        onMoveToSprint={bulk.bulkMoveToSprint}
        onChangePriority={bulk.bulkChangePriority}
        onDelete={bulk.bulkDelete}
      />

      {manageLabelsOpen && (
        <LabelManagementDialog
          open
          projectId={projectId}
          allLabels={availableLabels}
          onOpenChange={setManageLabelsOpen}
        />
      )}
      {sprintTemplateOpen && (
        <SprintTemplateDialog
          open
          projectId={projectId}
          onOpenChange={setSprintTemplateOpen}
        />
      )}
      {selectedTodoId && (
        <TodoDetailsDialog
          todoId={selectedTodoId}
          onOpenChange={(open) => !open && setSelectedTodoId(null)}
        />
      )}
      {createSprintOpen && (
        <SprintFormDialog
          open
          projectId={projectId}
          onOpenChange={setCreateSprintOpen}
        />
      )}
      <Modal
        open={Boolean(deletingTodo)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTodo(undefined);
            setDeleteError("");
          }
        }}
        title={`Delete “${deletingTodo?.key ?? "todo"}”?`}
        description="This permanently deletes this todo."
        size="confirm"
      >
        <div className="grid gap-4">
          {deleteError && (
            <p role="alert" className="text-small text-danger">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDeletingTodo(undefined)}>Cancel</Button>
            <Button
              variant="danger"
              loading={todoRemove.isPending}
              onClick={() => void deleteTodo()}
            >
              Delete todo
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function SprintSectionSkeleton() {
  return (
    <section className="theme-card mb-4 overflow-hidden rounded-md border-s-2 border-s-info">
      <header className="flex min-h-12 flex-wrap items-center gap-3 border-b border-line bg-info/5 px-3 py-2">
        <Skeleton className="size-7 shrink-0" />
        <div className="flex min-w-40 flex-1 items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-8 w-8" />
      </header>
      <div className="grid gap-1 py-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex min-h-11 items-center gap-2 px-2">
            <Skeleton className="size-4 shrink-0" />
            <Skeleton className="h-3 w-12 shrink-0" />
            <Skeleton className="h-4 min-w-0 flex-1" />
            <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
            <Skeleton className="hidden h-6 w-20 rounded-full md:block" />
            <Skeleton className="size-6 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

function BacklogLoadingSkeleton() {
  return (
    <section
      className="theme-card mt-5 overflow-hidden rounded-md border-s-2 border-s-brand"
      role="status"
      aria-label="Loading backlog"
    >
      <div className="flex min-h-12 items-center gap-2 border-b border-line bg-brand-soft/50 px-3">
        <Skeleton className="size-4" />
        <Skeleton className="size-7 rounded-sm" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="ms-auto h-4 w-12" />
      </div>
      <div className="grid gap-1 py-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex min-h-11 items-center gap-2 px-2">
            <Skeleton className="size-4 shrink-0" />
            <Skeleton className="h-4 w-3 shrink-0" />
            <Skeleton className="h-3 w-14 shrink-0" />
            <Skeleton className="h-4 min-w-0 flex-1" />
            <Skeleton className="hidden h-6 w-14 rounded-full sm:block" />
            <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <Skeleton className="size-6 shrink-0" />
          </div>
        ))}
      </div>
      <div className="flex min-h-14 items-center gap-3 border-t border-dashed border-line-strong px-4 py-2">
        <Skeleton className="size-4 shrink-0" />
        <Skeleton className="h-4 w-20 shrink-0" />
        <Skeleton className="h-4 min-w-0 w-56 max-w-full" />
      </div>
    </section>
  );
}
