import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/app/providers/toast";
import type { CompleteSprintRequest } from "../../../shared/types/api";
import { sprintsApi } from "../api/sprints.api";
import { useRefreshSprintData } from "./useRefreshSprintData";

export function useCompleteSprint(projectId: string) {
  const showToast = useToast();
  const refresh = useRefreshSprintData(projectId);

  return useMutation({
    mutationFn: ({
      sprintId,
      body,
    }: {
      sprintId: string;
      body: CompleteSprintRequest;
    }) => sprintsApi.complete(sprintId, body),
    meta: { handledInline: true },
    onSuccess: async (_data, { sprintId }) => {
      await refresh(sprintId);
      showToast("Sprint completed");
    },
  });
}
