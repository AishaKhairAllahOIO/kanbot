import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/app/providers/toast'
import { todosApi } from '../api/todos.api'
import { invalidateTodoQueries } from './todosCache.helpers'

type CreateTodoBody = Parameters<typeof todosApi.create>[1]

export function useCreateTodo(projectId: string) {
  const queryClient = useQueryClient()
  const showToast = useToast()

  return useMutation({
    mutationFn: (body: CreateTodoBody) => todosApi.create(projectId, body),
    meta: { handledInline: true },
    onSuccess: async () => {
      await invalidateTodoQueries(queryClient, projectId)
      showToast('Todo created')
    },
  })
}