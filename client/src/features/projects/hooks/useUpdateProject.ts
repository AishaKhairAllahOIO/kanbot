import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import type { ProjectWithStats } from '../../../shared/types/api'
import type { UpdateProjectRequest } from '../../../shared/types/api'
import { projectsApi } from '../api/projects.api'
import { useToast } from '@/app/providers/toast'

type UpdateProjectVars = {
  projectId: string
  body: UpdateProjectRequest
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  const showToast = useToast()

  return useMutation({
    mutationFn: ({ projectId, body }: UpdateProjectVars) =>
      projectsApi.update(projectId, body),
    meta: { handledInline: true },
    onSuccess: async (data, variables) => {
      queryClient.setQueryData<{ projects: ProjectWithStats[] }>(queryKeys.projects.all, (current) =>
        current && {
          ...current,
          projects: current.projects.map((project) =>
            project.id === variables.projectId ? data.project : project,
          ),
        },
      )
      queryClient.setQueryData(queryKeys.projects.detail(variables.projectId), data)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) }),
      ])
      showToast('Changes saved')
    },
  })
}