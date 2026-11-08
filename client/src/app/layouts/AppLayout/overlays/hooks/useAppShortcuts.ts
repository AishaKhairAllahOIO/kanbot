import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTheme } from "@/app/providers/theme";
import { useAppHotkeys } from "@/app/shortcuts/hooks/useAppHotkeys";
import { createShortcutRegistry } from "@/app/shortcuts/utils/shortcuts.registry";
import type { ShortcutItem } from "@/app/shortcuts/utils/shortcuts.registry";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import { useLayoutStore } from "../../shared/store/layoutStore";
import { useCurrentProject } from "../../shared/hooks/useCurrentProject";

interface UseAppShortcutsOptions {
  projectId?: string;
  onCreateSprint: () => void;
  onStartSprint: () => void;
  onCompleteSprint: () => void;
}

export function useAppShortcuts({
  projectId,
  onCreateSprint,
  onStartSprint,
  onCompleteSprint,
}: UseAppShortcutsOptions): {
  registry: ShortcutItem[];
  activeSprintId: string | null;
} {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { project } = useCurrentProject();
  const sprintsQuery = useSprints(projectId ?? "");
  const activeSprint =
    sprintsQuery.data?.sprints.find((sprint) => sprint.status === "active") ??
    null;
  const activeSprintId =
    activeSprint?.id ?? project?.stats.activeSprint?.id ?? null;
  const isPaletteOpen = useLayoutStore((state) => state.isPaletteOpen);
  const setPaletteOpen = useLayoutStore((state) => state.setPaletteOpen);
  const setShortcutsOpen = useLayoutStore((state) => state.setShortcutsOpen);
  const setAiPlanningTab = useLayoutStore((state) => state.setAiPlanningTab);
  const isBacklogPage = location.pathname.endsWith("/backlog");
  const isBoardPage = location.pathname.endsWith("/board");

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
          createSprint: onCreateSprint,
          startSprint: onStartSprint,
          completeSprint: onCompleteSprint,
          toggleTheme,
          openAssistant: () => setAiPlanningTab("chat"),
          generateTodos: () => setAiPlanningTab("generate"),
          planSprint: () => setAiPlanningTab("plan"),
          summarizeSprint: () => setAiPlanningTab("summarize"),
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
      isBacklogPage,
      isBoardPage,
      isPaletteOpen,
      navigate,
      navigateProjectPage,
      onCompleteSprint,
      onCreateSprint,
      onStartSprint,
      projectId,
      setAiPlanningTab,
      setPaletteOpen,
      setShortcutsOpen,
      toggleTheme,
    ],
  );

  useAppHotkeys(registry);
  return { registry, activeSprintId };
}
