import { getErrorMessage } from "@/shared/api/errors";
import { CompleteSprintDialog } from "@/features/board/components/CompleteSprintDialog";
import { useSprintBoard } from "@/features/sprints/hooks/useSprintBoard";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import { SprintLoadError } from "./SprintLoadError";
import { DialogQueryLoading } from "./DialogQueryLoading";

export function CompleteSprintAction({
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
