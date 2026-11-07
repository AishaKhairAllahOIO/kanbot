import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { getErrorMessage } from '../../../shared/api/errors'
import { useToast } from '@/app/providers/toast'
import type {
  MoveTodoRequest,
  SprintBoardResponse,
  Todo,
  TodoListQuery,
  TodoStatus,
} from '../../../shared/types/api'
import { todosApi } from '../api/todos.api'
import { isMatchingList, recalculateBoard } from './todosCache.helpers'

export function useMoveTodo(projectId: string) {
  const queryClient = useQueryClient()
  const showToast = useToast()

  return useMutation({
    mutationFn: ({ todoId, body }: { todoId: string; body: MoveTodoRequest }) =>
      todosApi.move(todoId, body),
    meta: { handledInline: true },

    onMutate: async ({ todoId, body }) => {
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

      const originalTodo =
        snapshots.flatMap(([, data]) => data?.todos ?? []).find((todo) => todo.id === todoId) ??
        boardSnapshots
          .flatMap(([, board]) => (board ? Object.values(board.columns).flat() : []))
          .find((todo) => todo.id === todoId)

      const movedTodo = originalTodo
        ? {
            ...originalTodo,
            sprintId: body.sprintId === undefined ? originalTodo.sprintId : body.sprintId,
            status: body.status ?? originalTodo.status,
            order: body.position,
          }
        : undefined

      for (const [key, data] of snapshots) {
        if (!data) continue
        const query = typeof key[2] === 'object' && key[2] ? (key[2] as TodoListQuery) : {}
        const source = data.todos.find((todo) => todo.id === todoId)
        if (!source) continue
        const nextTodo = movedTodo ?? source
        const remaining = data.todos.filter((todo) => todo.id !== todoId)
        const updated = isMatchingList(nextTodo, query)
          ? [
              ...remaining.slice(0, body.position),
              nextTodo,
              ...remaining.slice(body.position),
            ]
          : remaining
        queryClient.setQueryData(key, { todos: updated })
      }

      if (movedTodo) {
        const priorSprintId = originalTodo?.sprintId
        const nextSprintId = body.sprintId === undefined ? priorSprintId : body.sprintId
        const targetStatus = body.status ?? movedTodo.status

        boardSnapshots.forEach(([key, board]) => {
          if (!board) return
          const affectsBoard =
            board.sprint.id === priorSprintId || board.sprint.id === nextSprintId
          if (!affectsBoard) return

          const columns = { ...board.columns }
          Object.keys(columns).forEach((status) => {
            const column = status as TodoStatus
            columns[column] = columns[column].filter((todo) => todo.id !== todoId)
          })

          if (board.sprint.id === nextSprintId) {
            const destination = columns[targetStatus]
            const position = Math.min(Math.max(body.position, 0), destination.length)
            columns[targetStatus] = [
              ...destination.slice(0, position),
              { ...movedTodo, sprintId: nextSprintId, status: targetStatus, order: position },
              ...destination.slice(position),
            ]
          }

          queryClient.setQueryData(key, recalculateBoard(board, columns))
        })
      }

      return { snapshots, boardSnapshots, originalTodo }
    },

    onError: (error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
      context?.boardSnapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))

      const message = getErrorMessage(error)
      showToast(`${message} The change was undone.`, 'error')
    },

    onSuccess: (_data, variables, context) => {
      if (!context?.originalTodo) {
        showToast('Todo moved')
        return
      }
      const originalTodo = context.originalTodo
      showToast('Todo moved', 'success', {
        label: 'Undo',
        onClick: () => {
          void todosApi.move(variables.todoId, {
            sprintId: originalTodo.sprintId,
            status: originalTodo.status,
            position: originalTodo.order,
          })
            .then(() => Promise.all([
              queryClient.invalidateQueries({ queryKey: queryKeys.todos.all(projectId) }),
              queryClient.invalidateQueries({ queryKey: queryKeys.sprints.boards }),
              queryClient.invalidateQueries({ queryKey: queryKeys.sprints.list(projectId) }),
              queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
            ]))
            .catch((error: unknown) => showToast(getErrorMessage(error), 'error'))
        },
      })
    },

    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.todos.all(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sprints.boards }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sprints.list(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.todos.detail(variables.todoId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all}),
      ])
    },
  })
}