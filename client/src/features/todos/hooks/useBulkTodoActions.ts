import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '../../../shared/api/errors'
import type { Todo, TodoPriority } from '../../../shared/types/api'
import { todosApi } from '../api/todos.api'
import { queryKeys } from '../../../shared/api/queryKeys'
import { useToast } from '@/app/providers/toast'

export function useBulkTodoActions(projectId: string) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const showToast = useToast()

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectMany = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setSelectedIds(new Set())
    setError(null)
  }, [])

  const toggleAll = useCallback((allIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = allIds.length > 0 && allIds.every((id) => prev.has(id))
      if (allSelected) {
        return new Set()
      }
      return new Set(allIds)
    })
  }, [])

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all(projectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.list(projectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
    ])
  }, [projectId, queryClient])

  const bulkMoveToSprint = useCallback(
    async (sprintId: string | null) => {
      if (selectedIds.size === 0) return
      setIsProcessing(true)
      setError(null)
      try {
        const ids = Array.from(selectedIds)
        const todos = queryClient
          .getQueriesData<{ todos: Todo[] }>({ queryKey: queryKeys.todos.all(projectId) })
          .flatMap(([, data]) => data?.todos ?? [])
          .filter((todo, index, all) => ids.includes(todo.id) && all.findIndex((item) => item.id === todo.id) === index)
        const results = await Promise.allSettled(ids.map((id) => todosApi.update(id, { sprintId })))
        const movedIds = new Set(ids.filter((_, index) => results[index]?.status === 'fulfilled'))
        const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
        clear()
        await invalidate()
        const movedTodos = todos.filter((todo) => movedIds.has(todo.id))
        if (movedTodos.length > 0) {
          showToast(`${movedTodos.length} ${movedTodos.length === 1 ? 'todo' : 'todos'} moved`, 'success', {
            label: 'Undo',
            onClick: () => {
              void Promise.allSettled(movedTodos.map((todo) =>
                todosApi.move(todo.id, {
                  sprintId: todo.sprintId,
                  status: todo.status,
                  position: todo.order,
                }),
              ))
                .then(async (undoResults) => {
                  await invalidate()
                  const undoFailure = undoResults.find((result): result is PromiseRejectedResult => result.status === 'rejected')
                  if (undoFailure) showToast(getErrorMessage(undoFailure.reason), 'error')
                })
            },
          })
        }
        if (failed) showToast(getErrorMessage(failed.reason), 'error')
      } catch (err: unknown) {
        setError(getErrorMessage(err))
        await invalidate()
      } finally {
        setIsProcessing(false)
      }
    },
    [selectedIds, clear, invalidate, projectId, queryClient, showToast],
  )

  const bulkChangePriority = useCallback(
    async (priority: TodoPriority) => {
      if (selectedIds.size === 0) return
      setIsProcessing(true)
      setError(null)
      try {
        const ids = Array.from(selectedIds)
        const results = await Promise.allSettled(
          ids.map((id) => todosApi.update(id, { priority }))
        )
        clear()
        await invalidate()
        const updatedCount = results.filter((result) => result.status === 'fulfilled').length
        const failed = results.find(
          (result): result is PromiseRejectedResult => result.status === 'rejected',
        )
        if (updatedCount > 0) {
          showToast(
            `${updatedCount} ${updatedCount === 1 ? 'todo priority' : 'todo priorities'} updated`,
            'success',
          )
        }
        if (failed) setError(getErrorMessage(failed.reason))
      } catch (err: unknown) {
        setError(getErrorMessage(err))
        await invalidate()
      } finally {
        setIsProcessing(false)
      }
    },
    [selectedIds, clear, invalidate, showToast],
  )

  const bulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return
    setIsProcessing(true)
    setError(null)
    try {
      const ids = Array.from(selectedIds)
      const results = await Promise.allSettled(ids.map((id) => todosApi.remove(id)))
      const deletedIds = ids.filter((_, index) => results[index]?.status === 'fulfilled')
      const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
      clear()
      await invalidate()
      if (deletedIds.length > 0) {
        showToast(`${deletedIds.length} ${deletedIds.length === 1 ? 'todo' : 'todos'} deleted`, 'success', {
          label: 'Undo',
          onClick: () => {
            void Promise.allSettled(deletedIds.map((id) => todosApi.restore(id)))
              .then(async (undoResults) => {
                await invalidate()
                const undoFailure = undoResults.find((result): result is PromiseRejectedResult => result.status === 'rejected')
                if (undoFailure) showToast(getErrorMessage(undoFailure.reason), 'error')
              })
          },
        })
      }
      if (failed) showToast(getErrorMessage(failed.reason), 'error')
    } catch (err: unknown) {
      setError(getErrorMessage(err))
      await invalidate()
    } finally {
      setIsProcessing(false)
    }
  }, [selectedIds, clear, invalidate, showToast])

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelected: (id: string) => selectedIds.has(id),
    toggle,
    selectMany,
    toggleAll,
    clear,
    isProcessing,
    error,
    bulkMoveToSprint,
    bulkChangePriority,
    bulkDelete,
  }
}
