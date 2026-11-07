import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { ApiError, getErrorMessage } from '../../../shared/api/errors'
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
      const todo =
        snapshots.flatMap(([, data]) => data?.todos ?? []).find((item) => item.id === todoId) ??
        boardSnapshots
          .flatMap(([, board]) => (board ? Object.values(board.columns).flat() : []))
          .find((item) => item.id === todoId) ??
        queryClient.getQueryData<{ todo: Todo }>(queryKeys.todos.detail(todoId))?.todo

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

      return { snapshots, boardSnapshots, todo }
    },
    onError: async (error, _todoId, context) => {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        await invalidateTodoQueries(queryClient, projectId)
        return
      }
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
      context?.boardSnapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSuccess: async (_data, todoId, context) => {
      await invalidateTodoQueries(queryClient, projectId)
      if (!context?.todo) {
        showToast('Todo deleted')
        return
      }
      showToast('Todo deleted', 'success', {
        label: 'Undo',
        onClick: () => {
          void todosApi.restore(todoId)
            .then(() => invalidateTodoQueries(queryClient, projectId))
            .catch((error: unknown) => showToast(getErrorMessage(error), 'error'))
        },
      })
    },
  })
}