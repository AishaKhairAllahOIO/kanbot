import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/api/queryKeys'

export function useRefreshSprintData(projectId: string) {
  const queryClient = useQueryClient()

  return useCallback(
    async (sprintId?: string) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sprints.list(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.todos.list(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
        ...(sprintId
          ? [
              queryClient.invalidateQueries({ queryKey: queryKeys.sprints.detail(sprintId) }),
              queryClient.invalidateQueries({ queryKey: queryKeys.sprints.board(sprintId) }),
            ]
          : []),
      ])
    },
    [queryClient, projectId],
  )
}