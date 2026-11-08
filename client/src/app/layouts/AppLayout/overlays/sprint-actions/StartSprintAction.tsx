import { getErrorMessage } from "@/shared/api/errors";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import { StartSprintDialog } from "@/features/sprints/components/StartSprintDialog";
import { DialogQueryLoading } from "./DialogQueryLoading";
import { NoPlannedSprint } from "./NoPlannedSprint";
import { SprintLoadError } from "./SprintLoadError";

export function StartSprintAction({
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
