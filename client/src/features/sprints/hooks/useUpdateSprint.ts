import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/app/providers/toast";
import type { UpdateSprintRequest } from "../../../shared/types/api";
import { sprintsApi } from "../api/sprints.api";
import { useRefreshSprintData } from "./useRefreshSprintData";

export function useUpdateSprint(projectId: string) {
  const showToast = useToast();
  const refresh = useRefreshSprintData(projectId);

  return useMutation({
    mutationFn: ({
      sprintId,
      body,
    }: {
      sprintId: string;
      body: UpdateSprintRequest;
    }) => sprintsApi.update(sprintId, body),
    meta: { handledInline: true },
    onSuccess: async (_data, { sprintId }) => {
      await refresh(sprintId);
      showToast("Changes saved");
    },
  });
}
