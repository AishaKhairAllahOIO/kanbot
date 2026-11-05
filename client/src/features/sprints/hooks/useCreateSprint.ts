import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/app/providers/toast";
import type { CreateSprintRequest } from "../../../shared/types/api";
import { sprintsApi } from "../api/sprints.api";
import { useRefreshSprintData } from "./useRefreshSprintData";

export function useCreateSprint(projectId: string) {
  const showToast = useToast();
  const refresh = useRefreshSprintData(projectId);

  return useMutation({
    mutationFn: (body: CreateSprintRequest) =>
      sprintsApi.create(projectId, body),
    meta: { handledInline: true },
    onSuccess: async () => {
      await refresh();
      showToast("Sprint created");
    },
  });
}
