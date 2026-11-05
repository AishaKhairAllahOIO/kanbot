import { skipToken, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/api/queryKeys";
import { sprintsApi } from "../api/sprints.api";

export function useSprintBoard(sprintId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sprints.board(sprintId ?? ""),
    queryFn: sprintId ? () => sprintsApi.board(sprintId) : skipToken,
    meta: { handledInline: true },
  });
}
