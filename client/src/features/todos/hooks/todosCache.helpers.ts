import type {
  SprintBoardResponse,
  Todo,
  TodoListQuery,
  TodoStatus,
} from '../../../shared/types/api'
import { queryKeys } from '@/shared/api/queryKeys'

export function isMatchingList(todo: Todo, query: TodoListQuery) {
  if (query.sprintId === 'backlog' && todo.sprintId !== null) return false
  if (query.sprintId && query.sprintId !== 'backlog' && todo.sprintId !== query.sprintId) return false
  if (query.status && todo.status !== query.status) return false
  if (query.priority && todo.priority !== query.priority) return false
  if (query.type && todo.type !== query.type) return false
  return true
}

export function recalculateBoard(
  board: SprintBoardResponse,
  columns: SprintBoardResponse['columns'],
): SprintBoardResponse {
  const allTodos = Object.values(columns).flat()
  const doneTodos = columns.done
  const byStatus = Object.fromEntries(
    Object.entries(columns).map(([status, todos]) => [status, todos.length]),
  ) as Record<TodoStatus, number>
  return {
    ...board,
    columns,
    sprint: {
      ...board.sprint,
      stats: {
        totalTodos: allTodos.length,
        doneTodos: doneTodos.length,
        totalPoints: allTodos.reduce((sum, todo) => sum + (todo.storyPoints ?? 0), 0),
        donePoints: doneTodos.reduce((sum, todo) => sum + (todo.storyPoints ?? 0), 0),
        byStatus,
      },
    },
  }
}

export async function invalidateTodoQueries(
  queryClient: import('@tanstack/react-query').QueryClient,
  projectId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.todos.all(projectId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.sprints.boards }),
    queryClient.invalidateQueries({ queryKey: queryKeys.sprints.list(projectId)}),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
  ])
}