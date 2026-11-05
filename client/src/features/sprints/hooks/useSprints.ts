import { skipToken, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/api/queryKeys";
import { sprintsApi } from "../api/sprints.api";

export function useSprints(projectId: string) {
  return useQuery({
    queryKey: queryKeys.sprints.list(projectId),
    queryFn: projectId ? () => sprintsApi.list(projectId) : skipToken,
    meta: { handledInline: true },
  });
}

export function useSprint(sprintId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sprints.detail(sprintId ?? ''),
    queryFn: sprintId ? () => sprintsApi.get(sprintId) : skipToken,
    enabled: Boolean(sprintId),
    meta: { handledInline: true },
  });
}
