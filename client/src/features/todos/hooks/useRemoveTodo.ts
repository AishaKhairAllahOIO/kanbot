import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { ApiError } from '../../../shared/api/errors'
import { useToast } from '@/app/providers/toast'
import type { SprintBoardResponse, Todo } from '../../../shared/types/api'
import { todosApi } from '../api/todos.api'
import { invalidateTodoQueries, recalculateBoard } from './todosCache.helpers'

export function useRemoveTodo(projectId: string) {
  const queryClient = useQueryClient()
  const showToast = useToast()

  return useMutation({
    mutationFn: todosApi.remove,
    meta: { handledInline: true },
    onMutate: async (todoId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.todos.all(projectId) }),
        queryClient.cancelQueries({ queryKey: queryKeys.sprints.boards }),
      ])
      const snapshots = queryClient.getQueriesData<{ todos: Todo[] }>({
        queryKey: queryKeys.todos.all(projectId),
      })
      const boardSnapshots = queryClient.getQueriesData<SprintBoardResponse>({
        queryKey: queryKeys.sprints.boards,
      })

      snapshots.forEach(([key, data]) => {
        if (data?.todos.some((todo) => todo.id === todoId)) {
          queryClient.setQueryData(key, {
            todos: data.todos.filter((todo) => todo.id !== todoId),
          })
        }
      })

      boardSnapshots.forEach(([key, board]) => {
        if (
          !board ||
          !Object.values(board.columns).some((column) =>
            column.some((todo) => todo.id === todoId),
          )
        )
          return
        const columns = Object.fromEntries(
          Object.entries(board.columns).map(([status, todos]) => [
            status,
            todos.filter((todo) => todo.id !== todoId),
          ]),
        ) as SprintBoardResponse['columns']
        queryClient.setQueryData(key, recalculateBoard(board, columns))
      })

      return { snapshots, boardSnapshots }
    },
    onError: async (error, _todoId, context) => {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        await invalidateTodoQueries(queryClient, projectId)
        return
      }
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
      context?.boardSnapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSuccess: async () => {
      await invalidateTodoQueries(queryClient, projectId)
      showToast('Todo deleted')
    },
  })
}