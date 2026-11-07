import { useQueries } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { todosApi } from '@/features/todos/api/todos.api'
import { useProjects } from '@/features/projects/hooks/useProjects'
import {
  buildMyWeekDays,
  type MyWeekTodo,
} from '../utils/myWeekActivity'

export function useMyWeekActivity() {
  const projectsQuery = useProjects()
  const projects = projectsQuery.data?.projects ?? []
  const todoQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: queryKeys.todos.list(project.id),
      queryFn: () => todosApi.list(project.id),
      enabled: projectsQuery.isSuccess,
      meta: { handledInline: true },
    })),
  })

  const completedTodos: MyWeekTodo[] = todoQueries.flatMap((query, index) =>
    (query.data?.todos ?? [])
      .filter((todo) => todo.completedAt !== null)
      .map((todo) => ({
        id: todo.id,
        title: todo.title,
        completedAt: todo.completedAt!,
        projectName: projects[index].name,
      })),
  )

  const days = buildMyWeekDays(completedTodos)
  const error =
    projectsQuery.error ??
    todoQueries.find((query) => query.error)?.error ??
    null

  return {
    days,
    error,
    isLoading:
      projectsQuery.isLoading ||
      todoQueries.some((query) => query.isLoading),
    refetch: async () => {
      await Promise.all([
        projectsQuery.refetch(),
        ...todoQueries.map((query) => query.refetch()),
      ])
    },
  }
}
