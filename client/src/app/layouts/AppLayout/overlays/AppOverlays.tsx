import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { Modal } from "@/shared/components/Modal";
import { Spinner } from "@/shared/components/Spinner";
import { useLocalStorageState } from "@/shared/hooks/useLocalStorageState";
import { useTheme } from "@/app/providers/theme";
import { useCurrentProject } from "../shared/hooks/useCurrentProject";
import { useLayoutStore } from "../store/layoutStore";
import { CommandPalette } from "@/app/shortcuts/components/CommandPalette";
import { ShortcutsHelpDialog } from "@/app/shortcuts/components/ShortcutsHelpDialog";
import { createShortcutRegistry } from "@/app/shortcuts/utils/shortcuts.registry";
import type { ShortcutItem } from "@/app/shortcuts/utils/shortcuts.registry";
import { useAppHotkeys } from "@/app/shortcuts/hooks/useAppHotkeys";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import { useSprintBoard } from "@/features/sprints/hooks/useSprintBoard";
import { CompleteSprintDialog } from "@/features/board/components/CompleteSprintDialog";
import { SprintFormDialog } from "@/features/sprints/components/SprintFormDialog";
import { StartSprintDialog } from "@/features/sprints/components/StartSprintDialog";
import { TodoDetailsDialog } from "@/features/todos/components/TodoDetailsDialog";
import { useTodos } from "@/features/todos/hooks/useTodos";
import type { ProjectWithStats } from "@/shared/types/api";

const AiPlanningPanel = lazy(() =>
  import("@/features/ai/components/AiPlanningPanel").then((module) => ({
    default: module.AiPlanningPanel,
  })),
);
export function AppOverlays() {
  const { projectId } = useParams();
  const { project, projects, projectsLoading, projectsError, retryProjects } =
    useCurrentProject();
  const location = useLocation();
  const navigate = useNavigate();
  const isSprintsHistoryPage = location.pathname.endsWith("/sprints");
  const { toggleTheme } = useTheme();
  const aiPlanningTab = useLayoutStore((state) => state.aiPlanningTab);
  const setAiPlanningTab = useLayoutStore((state) => state.setAiPlanningTab);
  const setSelectedHistorySprintId = useLayoutStore(
    (state) => state.setSelectedHistorySprintId,
  );
  const selectedHistorySprintId = useLayoutStore(
    (state) => state.selectedHistorySprintId,
  );
  const pendingAssistantPrompt = useLayoutStore(
    (state) => state.pendingAssistantPrompt,
  );
  const consumeAssistantPrompt = useLayoutStore(
    (state) => state.consumeAssistantPrompt,
  );
  const isPaletteOpen = useLayoutStore((state) => state.isPaletteOpen);
  const setPaletteOpen = useLayoutStore((state) => state.setPaletteOpen);
  const isShortcutsOpen = useLayoutStore((state) => state.isShortcutsOpen);
  const setShortcutsOpen = useLayoutStore((state) => state.setShortcutsOpen);
  const [recentIds, setRecentIds] = useLocalStorageState<string[]>(
    "kanbot:command-recent",
    [],
  );
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [startSprintOpen, setStartSprintOpen] = useState(false);
  const [completeSprintOpen, setCompleteSprintOpen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const sprintsQuery = useSprints(projectId ?? "");
  const activeSprint =
    sprintsQuery.data?.sprints.find((sprint) => sprint.status === "active") ??
    null;
  const sprints = sprintsQuery.data?.sprints ?? [];
  const selectedHistorySprint =
    sprints.find((sprint) => sprint.id === selectedHistorySprintId) ??
    sprints.find((sprint) => sprint.status === "completed") ??
    activeSprint ??
    sprints[0] ??
    null;
  const summarySprint = isSprintsHistoryPage
    ? selectedHistorySprint?.status === "planned"
      ? activeSprint
      : selectedHistorySprint
    : activeSprint;
  const activeSprintId =
    activeSprint?.id ?? project?.stats.activeSprint?.id ?? null;
  const isBacklogPage = location.pathname.endsWith("/backlog");
  const isBoardPage = location.pathname.endsWith("/board");

  const onCreateTodos = useCallback(() => {
    setAiPlanningTab("generate");
  }, [setAiPlanningTab]);
  const onPlanSprint = useCallback(() => {
    setAiPlanningTab("plan");
  }, [setAiPlanningTab]);
  const viewBacklog = useCallback(
    (todoIds?: string[], sprintId?: string) => {
      setAiPlanningTab(null);
      if (projectId) {
        navigate(`/projects/${projectId}/backlog`, {
          state: todoIds || sprintId
            ? { highlightTodoIds: todoIds, highlightSprintId: sprintId }
            : null,
        });
      }
    },
    [navigate, projectId, setAiPlanningTab],
  );
  const viewSprint = useCallback(
    (sprintId: string) => {
      setSelectedHistorySprintId(sprintId);
      setAiPlanningTab(null);
      if (projectId) {
        navigate(`/projects/${projectId}/sprints`, {
          state: { focusSprintSummary: true },
        });
      }
    },
    [navigate, projectId, setAiPlanningTab, setSelectedHistorySprintId],
  );
  const navigateProjectPage = useCallback(
    (page: "backlog" | "board" | "sprints") => {
      if (projectId) navigate(`/projects/${projectId}/${page}`);
    },
    [navigate, projectId],
  );
  const createTodo = useCallback(() => {
    if (!projectId) return;
    if (location.pathname.endsWith("/backlog")) {
      document.querySelector<HTMLElement>("[data-shortcut-create]")?.focus();
      return;
    }
    navigate(`/projects/${projectId}/backlog`, {
      state: { shortcutFocusTodo: true },
    });
  }, [location.pathname, navigate, projectId]);
  const focusSearch = useCallback(() => {
    document.querySelector<HTMLElement>("[data-shortcut-search]")?.focus();
  }, []);
  const registry = useMemo(
    () =>
      createShortcutRegistry(
        {
          togglePalette: () => setPaletteOpen(!isPaletteOpen),
          openHelp: () => setShortcutsOpen(true),
          createTodo,
          focusSearch,
          goToBoard: () => navigateProjectPage("board"),
          goToBacklog: () => navigateProjectPage("backlog"),
          goToSprints: () => navigateProjectPage("sprints"),
          openProjects: () => navigate("/projects"),
          createSprint: () => setCreateSprintOpen(true),
          startSprint: () => setStartSprintOpen(true),
          completeSprint: () => setCompleteSprintOpen(true),
          toggleTheme,
          openAssistant: () => setAiPlanningTab("chat"),
          generateTodos: onCreateTodos,
          planSprint: onPlanSprint,
          summarizeSprint: () => {
            setAiPlanningTab("summarize");
          },
        },
        {
          hasProject: Boolean(projectId),
          hasPlannedSprint: Boolean(projectId),
          hasActiveSprint: Boolean(activeSprintId),
          isBacklogPage,
          isBoardPage,
        },
      ),
    [
      activeSprintId,
      createTodo,
      focusSearch,
      isPaletteOpen,
      navigate,
      navigateProjectPage,
      onCreateTodos,
      onPlanSprint,
      projectId,
      setAiPlanningTab,
      setPaletteOpen,
      setShortcutsOpen,
      toggleTheme,
      isBacklogPage,
      isBoardPage,
    ],
  );
  useAppHotkeys(registry);

  const selectPaletteItem = useCallback(
    (id: string) => {
      setRecentIds((current) =>
        [id, ...current.filter((recentId) => recentId !== id)].slice(0, 5),
      );
      if (id.startsWith("project:")) {
        navigate(`/projects/${id.slice("project:".length)}/backlog`);
      } else if (id.startsWith("todo:")) {
        setSelectedTodoId(id.slice("todo:".length));
      } else {
        registry.find((item) => item.id === id)?.run();
      }
    },
    [navigate, registry, setRecentIds],
  );

  return (
    <>
      {isPaletteOpen && projectId ? (
        <ProjectCommandPalette
          open
          onOpenChange={setPaletteOpen}
          registry={registry}
          projects={projects}
          projectId={projectId}
          recentIds={recentIds}
          onSelect={selectPaletteItem}
          projectsLoading={projectsLoading}
          projectsError={
            projectsError ? "Projects could not be loaded." : undefined
          }
          onRetryProjects={() => void retryProjects()}
        />
      ) : (
        <CommandPalette
          open={isPaletteOpen}
          onOpenChange={setPaletteOpen}
          registry={registry}
          projects={projects}
          todos={[]}
          recentIds={recentIds}
          onSelect={selectPaletteItem}
          dataLoading={projectsLoading}
          dataError={
            projectsError ? "Projects could not be loaded." : undefined
          }
          onRetryData={() => void retryProjects()}
        />
      )}
      <ShortcutsHelpDialog
        open={isShortcutsOpen}
        onOpenChange={setShortcutsOpen}
        registry={registry}
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
      {projectId && aiPlanningTab && (
        <Suspense fallback={null}>
          <AiPlanningPanel
            open
            projectId={projectId}
            pageContext={isBacklogPage ? "backlog" : isBoardPage ? "board" : "other"}
            pendingPrompt={pendingAssistantPrompt}
            sprints={sprints}
            summarySprint={summarySprint}
            tab={aiPlanningTab}
            onTabChange={(tab) => {
              setAiPlanningTab(tab);
            }}
            onPromptSent={consumeAssistantPrompt}
            onViewBacklog={viewBacklog}
            onViewSprint={viewSprint}
            onOpenChange={(open) => {
              if (!open) setAiPlanningTab(null);
            }}
            onOpenTodo={(todoId) => {
              setAiPlanningTab(null);
              setSelectedTodoId(todoId);
            }}
          />
        </Suspense>
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

function ProjectCommandPalette({
  open,
  onOpenChange,
  registry,
  projects,
  projectId,
  recentIds,
  onSelect,
  projectsLoading,
  projectsError,
  onRetryProjects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registry: ShortcutItem[];
  projects: ProjectWithStats[];
  projectId: string;
  recentIds: string[];
  onSelect: (id: string) => void;
  projectsLoading: boolean;
  projectsError?: string;
  onRetryProjects: () => void;
}) {
  const todosQuery = useTodos(projectId);
  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      registry={registry}
      projects={projects}
      todos={(todosQuery.data?.todos ?? []).map(({ id, key, title }) => ({
        id,
        key,
        title,
      }))}
      recentIds={recentIds}
      onSelect={onSelect}
      dataLoading={projectsLoading || todosQuery.isLoading}
      dataError={
        projectsError ??
        (todosQuery.isError ? getErrorMessage(todosQuery.error) : undefined)
      }
      onRetryData={() => {
        onRetryProjects();
        void todosQuery.refetch();
      }}
    />
  );
}

function StartSprintAction({
  projectId,
  onOpenChange,
}: {
  projectId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const sprintsQuery = useSprints(projectId);
  const plannedSprint = sprintsQuery.data?.sprints.find(
    (sprint) => sprint.status === "planned",
  );

  return (
      <>
      {sprintsQuery.isLoading && (
        <DialogQueryLoading
          title="Loading sprint options"
          onClose={() => onOpenChange(false)}
        />
      )}
      {!sprintsQuery.isLoading && !sprintsQuery.isError && !plannedSprint && (
        <NoPlannedSprint onOpenChange={onOpenChange} />
      )}
      {plannedSprint && (
        <StartSprintDialog
          open
          sprint={plannedSprint}
          onOpenChange={onOpenChange}
        />
      )}
      {sprintsQuery.isError && (
        <SprintLoadError
          message={getErrorMessage(sprintsQuery.error)}
          onRetry={() => void sprintsQuery.refetch()}
          onClose={() => onOpenChange(false)}
        />
      )}
    </>
  );
}

function NoPlannedSprint({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal open onOpenChange={onOpenChange} title="Start sprint" size="confirm">
      <div className="grid gap-4">
        <EmptyState
          title="No sprint is ready to start"
          description="Create a planned sprint before starting one."
        />
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CompleteSprintAction({
  projectId,
  activeSprintId,
  onOpenChange,
}: {
  projectId: string;
  activeSprintId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const sprintsQuery = useSprints(projectId);
  const boardQuery = useSprintBoard(activeSprintId);
  const sprints = sprintsQuery.data?.sprints ?? [];
  const sprint = sprints.find((item) => item.id === activeSprintId);
  const plannedSprints = sprints.filter((item) => item.status === "planned");

  return (
    <>
      {(sprintsQuery.isLoading || boardQuery.isLoading) && (
        <DialogQueryLoading
          title="Loading sprint details"
          onClose={() => onOpenChange(false)}
        />
      )}
      {sprint && boardQuery.data && (
        <CompleteSprintDialog
          open
          sprint={sprint}
          board={boardQuery.data}
          plannedSprints={plannedSprints}
          onOpenChange={onOpenChange}
        />
      )}
      {(sprintsQuery.isError ||
        boardQuery.isError ||
        (!sprintsQuery.isLoading && !sprint)) && (
        <SprintLoadError
          message={getErrorMessage(
            sprintsQuery.error ??
              boardQuery.error ??
              new Error("Active sprint could not be loaded."),
          )}
          onRetry={() => {
            void sprintsQuery.refetch();
            void boardQuery.refetch();
          }}
          onClose={() => onOpenChange(false)}
        />
      )}
    </>
  );
}

function SprintLoadError({
  message,
  onRetry,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Sprint could not be loaded"
      size="confirm"
    >
      <div className="grid gap-4">
        <EmptyState
          title="Sprint could not be loaded"
          description={message}
          error
          action={<Button onClick={onRetry}>Try again</Button>}
        />
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

function DialogQueryLoading({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      size="confirm"
    >
      <div className="flex justify-center py-4">
        <Spinner label={title} />
      </div>
    </Modal>
  );
}
