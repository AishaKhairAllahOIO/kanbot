import { useQuery } from '@tanstack/react-query'
import { queryKeys } from "@/shared/api/queryKeys";
import { projectsApi } from '../api/projects.api'
import { useProject } from './useProject'
import { useCreateProject } from './useCreateProject'
import { useUpdateProject } from './useUpdateProject'
import { useDeleteProject } from './useDeleteProject'

export { useProject }

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: projectsApi.list,
    meta: { handledInline: true },
  })
}

export function useProjectMutations() {
  const create = useCreateProject()
  const update = useUpdateProject()
  const remove = useDeleteProject()

  return { create, update, remove }
}