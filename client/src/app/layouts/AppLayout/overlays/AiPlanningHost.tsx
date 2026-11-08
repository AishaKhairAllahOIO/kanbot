import { lazy, Suspense, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { useLayoutStore } from "../shared/store/layoutStore";
import type { Sprint } from "@/shared/types/api";
import { useSprints } from "@/features/sprints/hooks/useSprints";

const AiPlanningPanel = lazy(() =>
  import("@/features/ai/components/AiPlanningPanel").then((module) => ({
    default: module.AiPlanningPanel,
  })),
);

export function AiPlanningHost({
  projectId,
  onOpenTodo,
}: {
  projectId: string;
  onOpenTodo: (todoId: string) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const aiPlanningTab = useLayoutStore((state) => state.aiPlanningTab);
  const setAiPlanningTab = useLayoutStore((state) => state.setAiPlanningTab);
  const setSelectedHistorySprintId = useLayoutStore(
    (state) => state.setSelectedHistorySprintId,
  );
  const selectedHistorySprintId = useLayoutStore(
    (state) => state.selectedHistorySprintId,
  );
  const sprintsQuery = useSprints(projectId);
  const sprints: Sprint[] = sprintsQuery.data?.sprints ?? [];
  const activeSprint = sprints.find((sprint) => sprint.status === "active") ?? null;
  const selectedHistorySprint =
    sprints.find((sprint) => sprint.id === selectedHistorySprintId) ??
    sprints.find((sprint) => sprint.status === "completed") ??
    activeSprint ??
    sprints[0] ??
    null;
  const summarySprint = location.pathname.endsWith("/sprints")
    ? selectedHistorySprint?.status === "planned"
      ? activeSprint
      : selectedHistorySprint
    : activeSprint;
  const pendingAssistantPrompt = useLayoutStore(
    (state) => state.pendingAssistantPrompt,
  );
  const consumeAssistantPrompt = useLayoutStore(
    (state) => state.consumeAssistantPrompt,
  );
  const isBacklogPage = location.pathname.endsWith("/backlog");
  const isBoardPage = location.pathname.endsWith("/board");
  const viewBacklog = useCallback(
    (todoIds?: string[], sprintId?: string) => {
      setAiPlanningTab(null);
      navigate(`/projects/${projectId}/backlog`, {
        state: todoIds || sprintId
          ? { highlightTodoIds: todoIds, highlightSprintId: sprintId }
          : null,
      });
    },
    [navigate, projectId, setAiPlanningTab],
  );
  const viewSprint = useCallback(
    (sprintId: string) => {
      setSelectedHistorySprintId(sprintId);
      setAiPlanningTab(null);
      navigate(`/projects/${projectId}/sprints`, {
        state: { focusSprintSummary: true },
      });
    },
    [navigate, projectId, setAiPlanningTab, setSelectedHistorySprintId],
  );

  return (
    <>
      {aiPlanningTab && (
        <Suspense fallback={null}>
          <AiPlanningPanel
            open
            projectId={projectId}
            pageContext={
              isBacklogPage ? "backlog" : isBoardPage ? "board" : "other"
            }
            pendingPrompt={pendingAssistantPrompt}
            sprints={sprints}
            summarySprint={summarySprint}
            tab={aiPlanningTab}
            onTabChange={setAiPlanningTab}
            onPromptSent={consumeAssistantPrompt}
            onViewBacklog={viewBacklog}
            onViewSprint={viewSprint}
            onOpenChange={(open) => {
              if (!open) setAiPlanningTab(null);
            }}
            onOpenTodo={(todoId) => {
              setAiPlanningTab(null);
              onOpenTodo(todoId);
            }}
          />
        </Suspense>
      )}
    </>
  );
}
