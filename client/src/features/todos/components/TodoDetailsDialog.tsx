import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Check, Plus, Trash2, X } from "lucide-react";
import type {
  StoryPoints,
  Todo,
  TodoPriority,
  TodoStatus,
  TodoType,
  TodoListQuery,
} from "@/shared/types/api";
import { queryKeys } from "@/shared/api/queryKeys";
import { ApiError, fieldErrors } from "@/shared/api/client";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  Field,
  SelectInput,
  TextArea,
  TextInput,
} from "@/shared/components/Field";
import { DatePickerInput } from "@/shared/components/DatePickerInput";
import { Modal } from "@/shared/components/Modal";
import { Spinner } from "@/shared/components/Spinner";
import { useTodo, useTodoMutations } from "@/features/todos/hooks/useTodos";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import { LabelBadge } from "@/features/todos/components/labels";
import { useLayoutStore } from "@/app/layouts/AppLayout/store/layoutStore";
import {
  buildTodoEstimatePrompt,
  buildTodoImprovementPrompt,
} from "@/features/ai/utils/todoPrompts";

interface TodoDraft {
  title: string;
  description: string;
  type: TodoType;
  status: TodoStatus;
  priority: TodoPriority;
  storyPoints: StoryPoints | null;
  labels: string[];
  dueDate: string;
  sprintId: string;
}

function toDraft(todo: Todo): TodoDraft {
  return {
    title: todo.title,
    description: todo.description,
    type: todo.type,
    status: todo.status,
    priority: todo.priority,
    storyPoints: todo.storyPoints,
    labels: todo.labels,
    dueDate: todo.dueDate ?? "",
    sprintId: todo.sprintId ?? "",
  };
}

const points: (StoryPoints | null)[] = [1, 2, 3, 5, 8, 13, null];

interface TodoDetailsDialogProps {
  todoId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function TodoDetailsDialog({
  todoId,
  onOpenChange,
}: TodoDetailsDialogProps) {
  const requestAssistantPrompt = useLayoutStore(
    (state) => state.requestAssistantPrompt,
  );
  const todoQuery = useTodo(todoId);
  const todo = todoQuery.data?.todo;
  const queryClient = useQueryClient();
  const sprintQuery = useSprints(todo?.projectId ?? "");
  const mutations = useTodoMutations(todo?.projectId ?? "");
  const [draftState, setDraftState] = useState<{
    todoId: string;
    draft: TodoDraft;
  } | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState("");
  const [labelEditError, setLabelEditError] = useState("");
  const [previousTodoId, setPreviousTodoId] = useState(todoId);
  const [formError, setFormError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string>
  >({});
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showScrollFade, setShowScrollFade] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const closingAfterSave = useRef(false);
  const updateScrollFade = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    setShowScrollFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 1,
    );
  }, []);

  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => updateScrollFade(element));
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    updateScrollFade(element);
    return () => observer.disconnect();
  }, [todo, updateScrollFade]);

  if (todoId !== previousTodoId) {
    setPreviousTodoId(todoId);
    setLabelInput("");
    setEditingLabel(null);
    setEditingLabelValue("");
    setLabelEditError("");
  }

  const draft = todo
    ? draftState?.todoId === todo.id
      ? draftState!.draft
      : toDraft(todo)
    : undefined;
  const isDirty = Boolean(
    todo && draft && JSON.stringify(toDraft(todo)) !== JSON.stringify(draft),
  );

  function requestClose(nextOpen: boolean) {
    if (!nextOpen && isDirty && !closingAfterSave.current) {
      setDiscardOpen(true);
      return;
    }
    if (!nextOpen) closingAfterSave.current = false;
    onOpenChange(nextOpen);
  }

  function update<K extends keyof TodoDraft>(key: K, value: TodoDraft[K]) {
    if (!todo || !draft) return;
    setDraftState({ todoId: todo.id, draft: { ...draft, [key]: value } });
    setFieldError("");
    setServerFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function addLabel(value: string) {
    const label = value.trim().replace(/,$/, "").trim();
    if (
      !label ||
      !draft ||
      draft.labels.includes(label) ||
      draft.labels.length >= 10
    )
      return;
    update("labels", [...draft.labels, label.slice(0, 30)]);
    setLabelInput("");
  }

  function saveLabelEdit() {
    if (!draft || !editingLabel) return;
    const label = editingLabelValue.trim();
    if (!label) {
      setLabelEditError("A label cannot be empty");
      return;
    }
    if (
      draft.labels.some(
        (existing) =>
          existing !== editingLabel &&
          existing.toLowerCase() === label.toLowerCase(),
      )
    ) {
      setLabelEditError("That label already exists");
      return;
    }
    update(
      "labels",
      draft.labels.map((existing) =>
        existing === editingLabel ? label : existing,
      ),
    );
    setEditingLabel(null);
    setEditingLabelValue("");
    setLabelEditError("");
  }

  function cancelLabelEdit() {
    setEditingLabel(null);
    setEditingLabelValue("");
    setLabelEditError("");
  }

  function getMovePosition(sprintId: string, status: TodoStatus) {
    if (!todo) return 0;
    const targetSprintId = sprintId || null;
    const listCounts = queryClient
      .getQueriesData<{ todos: Todo[] }>({
        queryKey: queryKeys.todos.all(todo.projectId),
      })
      .flatMap(([key, data]) => {
        if (!data || !key[2] || typeof key[2] !== "object") return [];
        const filters = key[2] as TodoListQuery;
        const expectedSprintId = targetSprintId ?? "backlog";
        if (
          filters.sprintId !== expectedSprintId ||
          (filters.status && filters.status !== status)
        ) {
          return [];
        }
        return [
          data.todos.filter(
            (item) =>
              item.sprintId === targetSprintId && item.status === status,
          ).length,
        ];
      });

    return listCounts.length > 0 ? Math.max(...listCounts) : 0;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!todo || !draft) return;
    if (editingLabel) {
      setLabelEditError("Save or cancel the label edit first");
      return;
    }
    if (!draft.title.trim()) {
      setFieldError("Enter a todo title");
      return;
    }
    setFormError("");
    setServerFieldErrors({});
    try {
      const moveNeeded =
        draft.status !== todo.status ||
        draft.sprintId !== (todo.sprintId ?? "");
      const updateBody = {
        title: draft.title.trim(),
        description: draft.description,
        type: draft.type,
        priority: draft.priority,
        storyPoints: draft.storyPoints,
        labels: draft.labels,
        dueDate: draft.dueDate || null,
      };
      const updateNeeded =
        updateBody.title !== todo.title ||
        updateBody.description !== todo.description ||
        updateBody.type !== todo.type ||
        updateBody.priority !== todo.priority ||
        updateBody.storyPoints !== todo.storyPoints ||
        JSON.stringify(updateBody.labels) !== JSON.stringify(todo.labels) ||
        updateBody.dueDate !== (todo.dueDate ?? null);
      let savedTodo = todo;

      if (updateNeeded) {
        const response = await mutations.update.mutateAsync({
          todoId: todo.id,
          body: updateBody,
        });
        savedTodo = response.todo;
      }

      if (moveNeeded) {
        const response = await mutations.move.mutateAsync({
          todoId: todo.id,
          body: {
            sprintId: draft.sprintId || null,
            status: draft.status,
            position: getMovePosition(draft.sprintId, draft.status),
          },
        });
        savedTodo = response.todo;
      }

      setDraftState({
        todoId: savedTodo.id,
        draft: toDraft(savedTodo),
      });
      closingAfterSave.current = true;
      onOpenChange(false);
    } catch (error) {
      const mapped = error instanceof ApiError ? fieldErrors(error) : {};
      setServerFieldErrors(mapped);
      setFieldError(mapped.title ?? "");
      const requestFields = [
        "title",
        "description",
        "type",
        "status",
        "priority",
        "storyPoints",
        "labels",
        "dueDate",
        "sprintId",
      ];
      setFormError(
        requestFields.some((field) => mapped[field])
          ? ""
          : getErrorMessage(error),
      );
    }
  }

  async function deleteTodo() {
    if (!todo) return;
    try {
      await mutations.remove.mutateAsync(todo.id);
      closingAfterSave.current = true;
      setDeleteOpen(false);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.code === "NOT_FOUND") {
        setDeleteOpen(false);
        closingAfterSave.current = true;
        onOpenChange(false);
        return;
      }
      setFormError(getErrorMessage(error));
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <Modal
        open={Boolean(todoId)}
        onOpenChange={requestClose}
        title={todo?.key ?? "Todo details"}
        size="details"
        panelClassName="dialog-panel--bounded"
        bodyClassName="min-h-0 flex-1 overflow-hidden"
      >
        {todoQuery.isLoading || (todo && !draft) ? (
          <div className="grid min-h-48 place-content-center" role="status">
            <Spinner label="Loading todo details" />
          </div>
        ) : todoQuery.isError || !todo || !draft ? (
          <EmptyState
            title="Todo could not be loaded"
            description={getErrorMessage(todoQuery.error)}
            error
            action={
              <Button onClick={() => void todoQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : (
          <form onSubmit={save} className="flex h-full min-h-0 flex-col">
            <div className="relative min-h-0 flex-1">
              <div
                ref={scrollContainerRef}
                onScroll={(event) => updateScrollFade(event.currentTarget)}
                className="h-full overflow-y-auto px-6 py-5"
              >
                <div className="grid gap-5">
                  {formError && (
                    <p
                      role="alert"
                      className="rounded-sm border border-danger/30 bg-danger/10 p-3 text-small text-ink"
                    >
                      {formError}
                    </p>
                  )}
                  <div className="grid gap-6 md:todo-details-grid">
              <div className="grid content-start gap-4">
                <Field id="todo-title" label="Title" error={fieldError}>
                  <TextInput
                    id="todo-title"
                    autoFocus
                    value={draft.title}
                    onChange={(event) => update("title", event.target.value)}
                    aria-describedby={
                      fieldError ? "todo-title-error" : undefined
                    }
                    invalid={Boolean(fieldError || serverFieldErrors.title)}
                  />
                </Field>
                <Field
                  id="todo-description"
                  label="Description"
                  optional
                  error={serverFieldErrors.description}
                >
                  <TextArea
                    id="todo-description"
                    rows={8}
                    value={draft.description}
                    onChange={(event) =>
                      update("description", event.target.value)
                    }
                    invalid={Boolean(serverFieldErrors.description)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leadingIcon={
                      <Bot aria-hidden="true" className="size-4" />
                    }
                    onClick={() => {
                      requestAssistantPrompt(
                        todo.projectId,
                        buildTodoImprovementPrompt({
                          key: todo.key,
                          title: draft.title,
                          description: draft.description,
                        }),
                        { todoId: todo.id, key: todo.key },
                      )
                      requestClose(false)
                    }}
                  >
                    Improve with AI
                  </Button>
                </Field>
                <dl className="grid grid-cols-2 gap-3 text-small text-muted">
                  <div>
                    <dt>Created</dt>
                    <dd>{new Date(todo.createdAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{new Date(todo.updatedAt).toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
              <div className="grid content-start gap-4">
                <Field
                  id="todo-status"
                  label="Status"
                  error={serverFieldErrors.status}
                >
                  <SelectInput
                    id="todo-status"
                    aria-invalid={Boolean(serverFieldErrors.status)}
                    value={draft.status}
                    onChange={(event) =>
                      update("status", event.target.value as TodoStatus)
                    }
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </SelectInput>
                </Field>
                <Field
                  id="todo-priority"
                  label="Priority"
                  error={serverFieldErrors.priority}
                >
                  <SelectInput
                    id="todo-priority"
                    aria-invalid={Boolean(serverFieldErrors.priority)}
                    value={draft.priority}
                    onChange={(event) =>
                      update("priority", event.target.value as TodoPriority)
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </SelectInput>
                </Field>
                <Field
                  id="todo-points"
                  label="Story points"
                  error={serverFieldErrors.storyPoints}
                >
                  <div
                    id="todo-points"
                    role="group"
                    aria-label="Story points"
                    aria-invalid={Boolean(serverFieldErrors.storyPoints)}
                    aria-describedby={
                      serverFieldErrors.storyPoints
                        ? "todo-points-error"
                        : undefined
                    }
                    className="flex flex-wrap gap-1"
                  >
                    {points.map((point) => (
                      <button
                        key={point ?? "none"}
                        type="button"
                        aria-pressed={draft.storyPoints === point}
                        onClick={() => update("storyPoints", point)}
                        className={`grid size-8 place-content-center rounded-sm border text-small tabular-nums ${draft.storyPoints === point ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-surface text-muted hover:bg-sunken"}`}
                      >
                        {point ?? "–"}
                      </button>
                    ))}
                  </div>
                  {draft.storyPoints === null && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      leadingIcon={
                        <Bot aria-hidden="true" className="size-4" />
                      }
                      onClick={() => {
                        requestAssistantPrompt(
                          todo.projectId,
                          buildTodoEstimatePrompt({
                            key: todo.key,
                            title: draft.title,
                            description: draft.description,
                            type: draft.type,
                          }),
                          { todoId: todo.id, key: todo.key },
                        )
                        requestClose(false)
                      }}
                    >
                      Estimate with AI
                    </Button>
                  )}
                </Field>
                <Field
                  id="todo-type"
                  label="Type"
                  error={serverFieldErrors.type}
                >
                  <SelectInput
                    id="todo-type"
                    aria-invalid={Boolean(serverFieldErrors.type)}
                    value={draft.type}
                    onChange={(event) =>
                      update("type", event.target.value as TodoType)
                    }
                  >
                    <option value="task">Task</option>
                    <option value="story">Story</option>
                    <option value="bug">Bug</option>
                  </SelectInput>
                </Field>
                <Field
                  id="todo-sprint"
                  label="Sprint"
                  error={serverFieldErrors.sprintId}
                >
                  {sprintQuery.isLoading ? (
                    <div className="py-2" role="status">
                      <Spinner label="Loading sprint options" />
                    </div>
                  ) : sprintQuery.isError ? (
                    <EmptyState
                      title="Sprint options could not be loaded"
                      description={getErrorMessage(sprintQuery.error)}
                      error
                      action={
                        <Button
                          size="sm"
                          onClick={() => void sprintQuery.refetch()}
                        >
                          Try again
                        </Button>
                      }
                    />
                  ) : (
                    <SelectInput
                      id="todo-sprint"
                      aria-invalid={Boolean(serverFieldErrors.sprintId)}
                      value={draft.sprintId}
                      onChange={(event) =>
                        update("sprintId", event.target.value)
                      }
                    >
                      <option value="">Backlog</option>
                      {(sprintQuery.data?.sprints ?? [])
                        .filter((sprint) => sprint.status !== "completed")
                        .map((sprint) => (
                          <option key={sprint.id} value={sprint.id}>
                            {sprint.name}
                          </option>
                        ))}
                    </SelectInput>
                  )}
                </Field>
                <Field
                  id="todo-labels"
                  label="Labels"
                  optional
                  helperText="Add a label with Enter or comma. Use the pencil to rename a label."
                  error={labelEditError || serverFieldErrors.labels}
                >
                  <div
                    aria-invalid={Boolean(serverFieldErrors.labels)}
                    aria-describedby={
                      serverFieldErrors.labels ? "todo-labels-error" : undefined
                    }
                    className="flex min-h-9 flex-wrap items-center gap-1 rounded-sm border border-line-strong bg-surface p-1.5"
                  >
                    {draft.labels.map((label) =>
                      editingLabel === label ? (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 rounded-xs border border-brand/30 bg-surface px-1"
                        >
                          <input
                            autoFocus
                            value={editingLabelValue}
                            maxLength={30}
                            aria-label={`Edit label ${label}`}
                            onChange={(event) => {
                              setEditingLabelValue(event.target.value);
                              setLabelEditError("");
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                saveLabelEdit();
                              } else if (event.key === "Escape") {
                                event.preventDefault();
                                cancelLabelEdit();
                              }
                            }}
                            className="w-24 bg-transparent px-1 text-caption text-ink outline-none"
                          />
                          <button
                            type="button"
                            aria-label={`Save label ${label}`}
                            onClick={saveLabelEdit}
                            className="text-muted hover:text-success"
                          >
                            <Check aria-hidden="true" className="size-3" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Cancel editing label ${label}`}
                            onClick={cancelLabelEdit}
                            className="text-muted hover:text-ink"
                          >
                            <X aria-hidden="true" className="size-3" />
                          </button>
                        </span>
                      ) : (
                        <LabelBadge
                          key={label}
                          projectId={todo.projectId}
                          label={label}
                          onEdit={() => {
                            setEditingLabel(label);
                            setEditingLabelValue(label);
                            setLabelEditError("");
                          }}
                          onRemove={() =>
                            update(
                              "labels",
                              draft.labels.filter((item) => item !== label),
                            )
                          }
                        />
                      ),
                    )}
                    <input
                      id="todo-labels"
                      value={labelInput}
                      maxLength={30}
                      onChange={(event) => setLabelInput(event.target.value)}
                      placeholder={
                        editingLabel
                          ? "Finish editing this label"
                          : draft.labels.length >= 10
                            ? "Maximum 10 labels"
                            : "Add a label..."
                      }
                      aria-invalid={Boolean(serverFieldErrors.labels)}
                      aria-describedby={
                        serverFieldErrors.labels
                          ? "todo-labels-error"
                          : undefined
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                          event.preventDefault();
                          addLabel(labelInput);
                        }
                        if (
                          event.key === "Backspace" &&
                          !labelInput &&
                          draft.labels.length
                        ) {
                          update("labels", draft.labels.slice(0, -1));
                        }
                      }}
                      disabled={
                        Boolean(editingLabel) || draft.labels.length >= 10
                      }
                      className="min-w-16 flex-1 bg-transparent px-1 text-small text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed"
                      aria-label="Add label"
                    />
                    <button
                      type="button"
                      aria-label="Add label"
                      disabled={
                        Boolean(editingLabel) || draft.labels.length >= 10
                      }
                      onClick={() => addLabel(labelInput)}
                      className="rounded-sm p-1 text-muted hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </Field>
                <Field
                  id="todo-due-date"
                  label="Due date"
                  optional
                  error={serverFieldErrors.dueDate}
                >
                  <DatePickerInput
                    id="todo-due-date"
                    invalid={Boolean(serverFieldErrors.dueDate)}
                    value={draft.dueDate}
                    onValueChange={(value) => update("dueDate", value)}
                  />
                </Field>
              </div>
                  </div>
                </div>
              </div>
              {showScrollFade && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-surface/80 to-transparent backdrop-blur-[2px]"
                />
              )}
            </div>
            <footer className="mx-6 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-surface py-4">
              <Button
                type="button"
                variant="danger"
                leadingIcon={<Trash2 aria-hidden="true" className="size-4" />}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" onClick={() => requestClose(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!isDirty}
                  loading={mutations.update.isPending || mutations.move.isPending}
                >
                  <Check aria-hidden="true" className="size-4" /> Save changes
                </Button>
              </div>
            </footer>
          </form>
        )}
      </Modal>
      <Modal
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard changes?"
        description="Your unsaved todo changes will be lost."
        size="confirm"
      >
        <div className="flex justify-end gap-2">
          <Button autoFocus onClick={() => setDiscardOpen(false)}>
            Keep editing
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setDiscardOpen(false);
              onOpenChange(false);
            }}
          >
            Discard
          </Button>
        </div>
      </Modal>
      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete “${todo?.key ?? "todo"}”?`}
        description="This permanently deletes this todo."
        size="confirm"
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            loading={mutations.remove.isPending}
            onClick={() => void deleteTodo()}
          >
            Delete todo
          </Button>
        </div>
      </Modal>
    </>
  );
}
