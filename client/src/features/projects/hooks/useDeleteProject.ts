import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { ApiError } from "../../../shared/api/errors";
import { projectsApi } from "../api/projects.api";
import { useToast } from "@/app/providers/toast";

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: projectsApi.remove,
    meta: { handledInline: true },
    onError: async (error, projectId) => {
      if (!(error instanceof ApiError) || error.code !== "NOT_FOUND") return;
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onSuccess: async (_data, projectId) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.removeQueries({
        predicate: ({ queryKey }) => queryKey.includes(projectId),
      });
      showToast("Project deleted");
    },
  });
}
