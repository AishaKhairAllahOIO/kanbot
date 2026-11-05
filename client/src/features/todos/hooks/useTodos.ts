import { useQuery } from '@tanstack/react-query'
import type { TodoListQuery } from '../../../shared/types/api'
import { queryKeys } from '@/shared/api/queryKeys'
import { todosApi } from '../api/todos.api'
import { useTodo } from './useTodo'
import { useCreateTodo } from './useCreateTodo'
import { useCreateManyTodos } from './useCreateManyTodos'
import { useUpdateTodo } from './useUpdateTodo'
import { useRemoveTodo } from './useRemoveTodo'
import { useMoveTodo } from './useMoveTodo'

export { useTodo }

export function useTodos(projectId: string, query: TodoListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.todos.list(projectId, query),
    queryFn: () => todosApi.list(projectId, query),
    enabled: Boolean(projectId),
    meta: { handledInline: true },
  })
}

export function useTodoMutations(projectId: string) {
  const create = useCreateTodo(projectId)
  const createMany = useCreateManyTodos(projectId)
  const update = useUpdateTodo(projectId)
  const remove = useRemoveTodo(projectId)
  const move = useMoveTodo(projectId)

  return { create, createMany, update, remove, move }
}