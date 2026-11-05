import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '../../../shared/api/errors'
import type { TodoPriority } from '../../../shared/types/api'
import { todosApi } from '../api/todos.api'
import { queryKeys } from '../../../shared/api/queryKeys'

export function useBulkTodoActions(projectId: string) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

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
        await Promise.all(
          ids.map((id) => todosApi.update(id, { sprintId }))
        )
        clear()
        await invalidate()
      } catch (err: unknown) {
        setError(getErrorMessage(err))
        await invalidate()
      } finally {
        setIsProcessing(false)
      }
    },
    [selectedIds, clear, invalidate],
  )

  const bulkChangePriority = useCallback(
    async (priority: TodoPriority) => {
      if (selectedIds.size === 0) return
      setIsProcessing(true)
      setError(null)
      try {
        const ids = Array.from(selectedIds)
        await Promise.all(
          ids.map((id) => todosApi.update(id, { priority }))
        )
        clear()
        await invalidate()
      } catch (err: unknown) {
        setError(getErrorMessage(err))
        await invalidate()
      } finally {
        setIsProcessing(false)
      }
    },
    [selectedIds, clear, invalidate],
  )

  const bulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return
    setIsProcessing(true)
    setError(null)
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(
        ids.map((id) => todosApi.remove(id))
      )
      clear()
      await invalidate()
    } catch (err: unknown) {
      setError(getErrorMessage(err))
      await invalidate()
    } finally {
      setIsProcessing(false)
    }
  }, [selectedIds, clear, invalidate])

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
