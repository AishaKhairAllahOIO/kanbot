import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { useToast } from '@/app/providers/toast'
import { aiApi } from '../api/ai.api'

export function useSummarizeSprint() {
  const queryClient = useQueryClient()
  const showToast = useToast()

  return useMutation({
    mutationFn: aiApi.summarizeSprint,
    meta: { handledInline: true },
    onSuccess: async ({ sprint }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sprints.list(sprint.projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sprints.detail(sprint.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sprints.board(sprint.id) }),
      ])
      showToast('Summary saved', 'success')
    },
  })
}
