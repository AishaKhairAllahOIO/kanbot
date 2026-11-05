import { differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns'
import type { TodoStatus } from '../../../shared/types/api'

export interface DueDateInfo {
  isOverdue: boolean
  isDueToday: boolean
  isDueTomorrow: boolean
  isDueThisWeek: boolean
  formatted: string
  label: string
  daysDiff: number
}

export function getDueDateInfo(dueDate: string | null | undefined, status?: TodoStatus): DueDateInfo | null {
  if (!dueDate) return null

  try {
    const date = parseISO(dueDate)
    const today = startOfDay(new Date())
    const targetDay = startOfDay(date)
    const daysDiff = differenceInCalendarDays(targetDay, today)
    const isDone = status === 'done'

    const isOverdue = !isDone && daysDiff < 0
    const isDueToday = !isDone && daysDiff === 0
    const isDueTomorrow = !isDone && daysDiff === 1
    const isDueThisWeek = !isDone && daysDiff >= 0 && daysDiff <= 7

    let label = format(date, 'MMM d')
    if (daysDiff === 0) {
      label = 'Today'
    } else if (daysDiff === 1) {
      label = 'Tomorrow'
    } else if (daysDiff === -1 && !isDone) {
      label = '1 day overdue'
    } else if (daysDiff < -1 && !isDone) {
      label = `${Math.abs(daysDiff)} days overdue`
    }

    return {
      isOverdue,
      isDueToday,
      isDueTomorrow,
      isDueThisWeek,
      formatted: format(date, 'MMM d, yyyy'),
      label,
      daysDiff,
    }
  } catch {
    return null
  }
}

