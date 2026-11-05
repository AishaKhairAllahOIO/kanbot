import { useQuery } from '@tanstack/react-query'
import { queryKeys } from "@/shared/api/queryKeys";
import { projectsApi } from '../api/projects.api'

export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => projectsApi.get(projectId),
    enabled: Boolean(projectId),
    meta: { handledInline: true },
  })
}