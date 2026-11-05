import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { todosApi } from '../api/todos.api'

export function useTodo(todoId: string | null) {
  return useQuery({
    queryKey: queryKeys.todos.detail(todoId),
    queryFn: () => todosApi.get(todoId!),
    enabled: Boolean(todoId),
    meta: { handledInline: true },
  })
}
