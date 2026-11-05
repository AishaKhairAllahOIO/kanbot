import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/app/providers/toast'
import type { BulkCreateTodosRequest } from '../../../shared/types/api'
import { todosApi } from '../api/todos.api'
import { invalidateTodoQueries } from './todosCache.helpers'

export function useCreateManyTodos(projectId: string) {
  const queryClient = useQueryClient()
  const showToast = useToast()

  return useMutation({
    mutationFn: (body: BulkCreateTodosRequest) => todosApi.createMany(projectId, body),
    meta: { handledInline: true },
    onSuccess: async ({ todos }) => {
      await invalidateTodoQueries(queryClient, projectId)
      showToast(`${todos.length} todos added to the backlog`)
    },
  })
}