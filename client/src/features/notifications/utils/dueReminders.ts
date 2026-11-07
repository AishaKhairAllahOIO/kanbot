import type { Todo } from '@/shared/types/api'

export type DueReminderKind = 'due' | 'overdue'

export interface DueReminderTodo {
  id: string
  key: string
  dueDate: string
  kind: DueReminderKind
}

export function getLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isValidLocalDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(0)
  parsed.setHours(0, 0, 0, 0)
  parsed.setFullYear(year, month - 1, day)
  return parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
}

export function getReminderDateKey(today: Date, daysBefore: 0 | 1) {
  const reminderDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
  reminderDate.setDate(reminderDate.getDate() + daysBefore)
  return getLocalDateKey(reminderDate)
}

export function isReminderTimeReached(remindAtTime: string, now: Date) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(remindAtTime)
  if (!match) return false
  const reminderMinutes = Number(match[1]) * 60 + Number(match[2])
  return now.getHours() * 60 + now.getMinutes() >= reminderMinutes
}

export function getDueReminderTodos(
  todos: Todo[],
  today: Date,
  daysBefore: 0 | 1,
): DueReminderTodo[] {
  const todayKey = getLocalDateKey(today)
  const dueKey = getReminderDateKey(today, daysBefore)
  const reminders: DueReminderTodo[] = []

  todos.forEach((todo) => {
    if (todo.status === 'done' || !todo.dueDate) return
    if (!isValidLocalDateKey(todo.dueDate)) return

    if (todo.dueDate < todayKey) {
      reminders.push({ id: todo.id, key: todo.key, dueDate: todo.dueDate, kind: 'overdue' })
      return
    }
    if (todo.dueDate === dueKey) {
      reminders.push({ id: todo.id, key: todo.key, dueDate: todo.dueDate, kind: 'due' })
    }
  })

  return reminders
}

export function getDueReminderKey(todo: DueReminderTodo) {
  return `${todo.id}:${todo.dueDate}:${todo.kind}`
}
