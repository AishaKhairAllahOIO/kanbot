import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { getErrorMessage } from '@/shared/api/errors'
import { useToast } from '@/app/providers/toast'
import { queryKeys } from '@/shared/api/queryKeys'
import { projectsApi } from '@/features/projects/api/projects.api'
import { todosApi } from '@/features/todos/api/todos.api'
import { paths } from '@/shared/config/paths'
import { useNotificationStore } from '../store/notificationStore'
import {
  getDueReminderKey,
  getDueReminderTodos,
  isReminderTimeReached,
} from '../utils/dueReminders'
import type { ReminderNotification } from '../store/notificationStore'

export function useDueReminders() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const scanInProgress = useRef(false)
  const scanErrorShown = useRef(false)
  const showToast = useToast()
  const enabledProjectIds = useNotificationStore((state) => state.enabledProjectIds)
  const remindAtTime = useNotificationStore((state) => state.remindAtTime)
  const daysBefore = useNotificationStore((state) => state.daysBefore)

  const scan = useCallback(async () => {
    const now = new Date()
    if (
      scanInProgress.current ||
      !isReminderTimeReached(remindAtTime, now) ||
      enabledProjectIds.length === 0
    ) return

    scanInProgress.current = true
    try {
      const { projects } = await queryClient.fetchQuery({
        queryKey: queryKeys.projects.all,
        queryFn: projectsApi.list,
        staleTime: 0,
        meta: { handledInline: true },
      })
      const enabledProjects = projects.filter((project) =>
        enabledProjectIds.includes(project.id),
      )
      const results = await Promise.allSettled(
        enabledProjects.map((project) =>
          queryClient.fetchQuery({
            queryKey: queryKeys.todos.list(project.id),
            queryFn: () => todosApi.list(project.id),
            staleTime: 0,
            meta: { handledInline: true },
          }),
        ),
      )
      const failedResult = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      )
      if (failedResult) {
        if (!scanErrorShown.current) {
          showToast(getErrorMessage(failedResult.reason), 'error')
          scanErrorShown.current = true
        }
      }

      results.forEach((result, index) => {
        if (result.status === 'rejected') return
        const project = enabledProjects[index]
        if (!useNotificationStore.getState().enabledProjectIds.includes(project.id)) return
        const { todos } = result.value
        useNotificationStore.getState().reconcileNotifiedKeys(
          todos.map((todo) => ({
            id: todo.id,
            dueDate: todo.dueDate,
            status: todo.status,
          })),
        )
        const notifiedKeys = new Set(
          useNotificationStore.getState().notifiedKeys,
        )
        const dueReminders = getDueReminderTodos(todos, now, daysBefore)
        const inAppNotifications: ReminderNotification[] = dueReminders
          .filter((todo) => !useNotificationStore.getState().dismissedNotificationIds.includes(
            `${project.id}:${getDueReminderKey(todo)}`,
          ))
          .map((reminder) => {
            const todo = todos.find((item) => item.id === reminder.id)
            return {
              id: `${project.id}:${getDueReminderKey(reminder)}`,
              projectId: project.id,
              projectName: project.name,
              todoId: reminder.id,
              todoKey: reminder.key,
              todoTitle: todo?.title ?? reminder.key,
              dueDate: reminder.dueDate,
              kind: reminder.kind,
              createdAt: now.toISOString(),
              isRead: false,
            }
          })
        useNotificationStore.getState().addNotifications(inAppNotifications)

        const pending = dueReminders
          .filter((todo) => !notifiedKeys.has(getDueReminderKey(todo)))

        const dueTodos = pending.filter((todo) => todo.kind === 'due')
        const overdueTodos = pending.filter((todo) => todo.kind === 'overdue')
        if (pending.length === 0 || !('Notification' in window) || Notification.permission !== 'granted') return

        const dueLabel = daysBefore === 0 ? 'today' : 'tomorrow'
        const summary = [
          dueTodos.length > 0 && `${dueTodos.length} due ${dueLabel}`,
          overdueTodos.length > 0 && `${overdueTodos.length} overdue`,
        ].filter(Boolean).join(', ')
        const body = [
          dueTodos.length > 0 && `Due ${dueLabel}: ${dueTodos.map((todo) => todo.key).join(', ')}`,
          overdueTodos.length > 0 && `Overdue: ${overdueTodos.map((todo) => todo.key).join(', ')}`,
        ].filter(Boolean).join('\n')
        try {
          const notification = new Notification(`${project.name}: ${summary}`, { body })
          notification.onclick = () => {
            window.focus()
            navigate(paths.board(project.id))
            notification.close()
          }

          useNotificationStore.getState().addNotifiedKeys(
            pending.map(getDueReminderKey),
          )
        } catch (error) {
          if (!scanErrorShown.current) {
            showToast(getErrorMessage(error), 'error')
            scanErrorShown.current = true
          }
        }
      })
      if (!failedResult && ('Notification' in window) && Notification.permission === 'granted') {
        scanErrorShown.current = false
      }
    } catch (error) {
      if (!scanErrorShown.current) {
        showToast(getErrorMessage(error), 'error')
        scanErrorShown.current = true
      }
    } finally {
      scanInProgress.current = false
    }
  }, [daysBefore, enabledProjectIds, navigate, queryClient, remindAtTime, showToast])

  useEffect(() => {
    void scan()
    const interval = window.setInterval(() => void scan(), 60_000)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void scan()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [scan])
}
