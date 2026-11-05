import { useMutation } from "@tanstack/react-query";
import { ApiError } from "../../../shared/api/errors";
import { useToast } from "@/app/providers/toast";
import { sprintsApi } from "../api/sprints.api";
import { useRefreshSprintData } from "./useRefreshSprintData";

export function useDeleteSprint(projectId: string) {
  const showToast = useToast();
  const refresh = useRefreshSprintData(projectId);

  return useMutation({
    mutationFn: sprintsApi.remove,
    meta: { handledInline: true },
    onError: async (error, sprintId) => {
      if (error instanceof ApiError && error.code === "NOT_FOUND") await refresh(sprintId);
    },
    onSuccess: async () => {
      await refresh();
      showToast("Sprint deleted");
    },
  });
}
