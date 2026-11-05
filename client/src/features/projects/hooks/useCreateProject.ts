import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { projectsApi } from '../api/projects.api'
import { useToast } from '@/app/providers/toast'

export function useCreateProject() {
  const queryClient = useQueryClient()
  const showToast = useToast()

  return useMutation({
    mutationFn: projectsApi.create,
    meta: { handledInline: true },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      showToast('Project created')
    },
  })
}