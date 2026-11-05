import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/app/providers/toast'
import { queryKeys } from '@/shared/api/queryKeys'
import { todosApi } from '../api/todos.api'
import { invalidateTodoQueries } from './todosCache.helpers'

type UpdateTodoBody = Parameters<typeof todosApi.update>[1]

export function useUpdateTodo(projectId: string) {
  const queryClient = useQueryClient()
  const showToast = useToast()

  return useMutation({
    mutationFn: ({ todoId, body }: { todoId: string; body: UpdateTodoBody }) =>
      todosApi.update(todoId, body),
    meta: { handledInline: true },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        invalidateTodoQueries(queryClient, projectId),
        queryClient.invalidateQueries({ queryKey: queryKeys.todos.detail(variables.todoId) }),
      ])
      showToast('Changes saved')
    },
  })
}