import { useCallback, useState } from "react";
import { useParams } from "react-router";
import { SprintFormDialog } from "@/features/sprints/components/SprintFormDialog";
import { TodoDetailsDialog } from "@/features/todos/components/TodoDetailsDialog";
import { AiPlanningHost } from "./AiPlanningHost";
import { CommandPaletteHost } from "./CommandPaletteHost";
import { useAppShortcuts } from "./hooks/useAppShortcuts";
import { CompleteSprintAction } from "./sprint-actions/CompleteSprintAction";
import { StartSprintAction } from "./sprint-actions/StartSprintAction";

export function AppOverlays() {
  const { projectId } = useParams();
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [startSprintOpen, setStartSprintOpen] = useState(false);
  const [completeSprintOpen, setCompleteSprintOpen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const openCreateSprint = useCallback(() => setCreateSprintOpen(true), []);
  const openStartSprint = useCallback(() => setStartSprintOpen(true), []);
  const openCompleteSprint = useCallback(() => setCompleteSprintOpen(true), []);
  const { registry, activeSprintId } = useAppShortcuts({
    projectId,
    onCreateSprint: openCreateSprint,
    onStartSprint: openStartSprint,
    onCompleteSprint: openCompleteSprint,
  });

  return (
    <>
      <CommandPaletteHost
        registry={registry}
        onOpenTodo={setSelectedTodoId}
      />
      {projectId && createSprintOpen && (
        <SprintFormDialog
          open
          projectId={projectId}
          onOpenChange={setCreateSprintOpen}
        />
      )}
      {projectId && startSprintOpen && (
        <StartSprintAction
          projectId={projectId}
          onOpenChange={setStartSprintOpen}
        />
      )}
      {projectId && completeSprintOpen && activeSprintId && (
        <CompleteSprintAction
          projectId={projectId}
          activeSprintId={activeSprintId}
          onOpenChange={setCompleteSprintOpen}
        />
      )}
      {projectId && (
        <AiPlanningHost
          projectId={projectId}
          onOpenTodo={setSelectedTodoId}
        />
      )}
      {selectedTodoId && (
        <TodoDetailsDialog
          todoId={selectedTodoId}
          onOpenChange={(open) => !open && setSelectedTodoId(null)}
        />
      )}
    </>
  );
}
