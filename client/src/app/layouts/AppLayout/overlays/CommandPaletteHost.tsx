import { useNavigate, useParams } from "react-router";
import { getErrorMessage } from "@/shared/api/errors";
import { CommandPalette } from "@/app/shortcuts/components/CommandPalette";
import { ShortcutsHelpDialog } from "@/app/shortcuts/components/ShortcutsHelpDialog";
import type { ShortcutItem } from "@/app/shortcuts/utils/shortcuts.registry";
import { useTodos } from "@/features/todos/hooks/useTodos";
import type { ProjectWithStats } from "@/shared/types/api";
import { useCurrentProject } from "../shared/hooks/useCurrentProject";
import { useLayoutStore } from "../shared/store/layoutStore";
import { useLocalStorageState } from "@/shared/hooks/useLocalStorageState";

export function CommandPaletteHost({
  registry,
  onOpenTodo,
}: {
  registry: ShortcutItem[];
  onOpenTodo: (todoId: string) => void;
}) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, projectsLoading, projectsError, retryProjects } =
    useCurrentProject();
  const isPaletteOpen = useLayoutStore((state) => state.isPaletteOpen);
  const setPaletteOpen = useLayoutStore((state) => state.setPaletteOpen);
  const isShortcutsOpen = useLayoutStore((state) => state.isShortcutsOpen);
  const setShortcutsOpen = useLayoutStore((state) => state.setShortcutsOpen);
  const [recentIds, setRecentIds] = useLocalStorageState<string[]>(
    "kanbot:command-recent",
    [],
  );
  const selectPaletteItem = (id: string) => {
    setRecentIds((current) =>
      [id, ...current.filter((recentId) => recentId !== id)].slice(0, 5),
    );
    if (id.startsWith("project:")) {
      navigate(`/projects/${id.slice("project:".length)}/backlog`);
    } else if (id.startsWith("todo:")) {
      onOpenTodo(id.slice("todo:".length));
    } else {
      registry.find((item) => item.id === id)?.run();
    }
  };

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
