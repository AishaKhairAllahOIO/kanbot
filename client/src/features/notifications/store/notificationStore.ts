import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface ReminderNotification {
  id: string
  projectId: string
  projectName: string
  todoId: string
  todoKey: string
  todoTitle: string
  dueDate: string
  kind: 'due' | 'overdue'
  createdAt: string
  isRead: boolean
}

interface NotificationState {
  enabledProjectIds: string[]
  remindAtTime: string
  daysBefore: 0 | 1
  notifiedKeys: string[]
  notifications: ReminderNotification[]
  dismissedNotificationIds: string[]
  toggleProject: (projectId: string) => void
  setRemindAtTime: (time: string) => void
  setDaysBefore: (days: 0 | 1) => void
  addNotifiedKeys: (keys: string[]) => void
  addNotifications: (notifications: ReminderNotification[]) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
  reconcileNotifiedKeys: (
    todos: { id: string; dueDate: string | null; status: string }[],
  ) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      enabledProjectIds: [],
      remindAtTime: '09:00',
      daysBefore: 0,
      notifiedKeys: [],
      notifications: [],
      dismissedNotificationIds: [],
      toggleProject: (projectId) =>
        set((state) => ({
          enabledProjectIds: state.enabledProjectIds.includes(projectId)
            ? state.enabledProjectIds.filter((id) => id !== projectId)
            : [...state.enabledProjectIds, projectId],
        })),
      setRemindAtTime: (remindAtTime) => set({ remindAtTime }),
      setDaysBefore: (daysBefore) => set({ daysBefore }),
      addNotifiedKeys: (keys) =>
        set((state) => ({
          notifiedKeys: Array.from(new Set([...state.notifiedKeys, ...keys])),
        })),
      addNotifications: (notifications) =>
        set((state) => {
          const existingIds = new Set([
            ...state.notifications.map((item) => item.id),
            ...state.dismissedNotificationIds,
          ])
          const added = notifications.filter((item) => !existingIds.has(item.id))
          if (added.length === 0) return state
          const nextNotifications = [...added, ...state.notifications]
          const removed = nextNotifications.slice(100)
          return {
            notifications: nextNotifications.slice(0, 100),
            dismissedNotificationIds: Array.from(new Set([
              ...state.dismissedNotificationIds,
              ...removed.map((item) => item.id),
            ])).slice(-500),
          }
        }),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, isRead: true } : item,
          ),
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, isRead: true })),
        })),
      clearNotifications: () =>
        set((state) => ({
          notifications: [],
          dismissedNotificationIds: Array.from(new Set([
            ...state.dismissedNotificationIds,
            ...state.notifications.map((item) => item.id),
          ])).slice(-500),
        })),
      reconcileNotifiedKeys: (todos) =>
        set((state) => {
          const currentTodos = new Map(todos.map((todo) => [todo.id, todo]))
          const notifiedKeys = state.notifiedKeys.filter((key) => {
            const [todoId, dueDate] = key.split(':')
            const todo = currentTodos.get(todoId)
            return !todo || (
              todo.status !== 'done' &&
              todo.dueDate !== null &&
              todo.dueDate === dueDate
            )
          })
          return notifiedKeys.length === state.notifiedKeys.length
            ? state
            : { notifiedKeys }
        }),
    }),
    {
      name: 'kanbot:due-reminders',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        enabledProjectIds: state.enabledProjectIds,
        remindAtTime: state.remindAtTime,
        daysBefore: state.daysBefore,
        notifiedKeys: state.notifiedKeys,
        notifications: state.notifications,
        dismissedNotificationIds: state.dismissedNotificationIds,
      }),
    },
  ),
)
