import { addDays, differenceInCalendarDays, endOfDay, format, isAfter, parseISO, startOfDay } from 'date-fns'
import type { Sprint, Todo } from '@/shared/types/api'

export interface BurndownDay {
  date: string
  label: string
  idealPoints: number
  actualPoints: number | null
  completedPoints: number
  isToday: boolean
}

export interface BurndownData {
  days: BurndownDay[]
  totalPoints: number
  remainingPoints: number
  isOverCapacity: boolean
}

export function computeBurndownData(sprint: Sprint, todos: Todo[]): BurndownData {
  const totalPoints =
    todos.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0) || sprint.stats.totalPoints || 0

  const today = startOfDay(new Date())
  const start = sprint.startDate ? startOfDay(parseISO(sprint.startDate)) : today
  const end = sprint.endDate ? startOfDay(parseISO(sprint.endDate)) : addDays(start, 14)

  const totalDays = Math.max(1, differenceInCalendarDays(end, start))
  const days: BurndownDay[] = []

  let runningRemaining = totalPoints

  for (let i = 0; i <= totalDays; i++) {
    const currentDay = addDays(start, i)
    const dayEnd = endOfDay(currentDay)
    const isFuture = isAfter(currentDay, today)
    const isCurrentDay = differenceInCalendarDays(currentDay, today) === 0

    // Ideal remaining points drops linearly to 0
    const idealPoints = Math.round((totalPoints - (totalPoints * (i / totalDays))) * 10) / 10

    if (isFuture) {
      days.push({
        date: format(currentDay, 'yyyy-MM-dd'),
        label: format(currentDay, 'MMM d'),
        idealPoints,
        actualPoints: null,
        completedPoints: 0,
        isToday: isCurrentDay,
      })
    } else {
      // Calculate how many points were completed on or before currentDay
      const completedSoFar = todos
        .filter((t) => {
          if (t.status !== 'done' || !t.completedAt) return false
          try {
            return parseISO(t.completedAt) <= dayEnd
          } catch {
            return false
          }
        })
        .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0)

      const remaining = Math.max(0, totalPoints - completedSoFar)
      runningRemaining = remaining

      days.push({
        date: format(currentDay, 'yyyy-MM-dd'),
        label: format(currentDay, 'MMM d'),
        idealPoints,
        actualPoints: remaining,
        completedPoints: completedSoFar,
        isToday: isCurrentDay,
      })
    }
  }

  return {
    days,
    totalPoints,
    remainingPoints: runningRemaining,
    isOverCapacity: runningRemaining > 0 && isAfter(today, end),
  }
}
