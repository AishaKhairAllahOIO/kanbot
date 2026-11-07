import { format, isValid, parseISO, startOfDay, subDays } from 'date-fns'

export interface MyWeekTodo {
  id: string
  title: string
  completedAt: string
  projectName: string
}

export interface MyWeekDay {
  date: Date
  dateKey: string
  todos: MyWeekTodo[]
  level: 0 | 1 | 2 | 3 | 4
}

export function getMyWeekDayKey(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

export function getActivityLevel(count: number): MyWeekDay['level'] {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  if (count <= 6) return 3
  return 4
}

export function buildMyWeekDays(
  todos: MyWeekTodo[],
  today = new Date(),
): MyWeekDay[] {
  const lastDay = startOfDay(today)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(lastDay, 6 - index)
    return {
      date,
      dateKey: getMyWeekDayKey(date),
      todos: [] as MyWeekTodo[],
      level: 0 as MyWeekDay['level'],
    }
  })
  const daysByKey = new Map(days.map((day) => [day.dateKey, day]))

  todos.forEach((todo) => {
    const completedAt = parseISO(todo.completedAt)
    if (!isValid(completedAt)) return

    const day = daysByKey.get(getMyWeekDayKey(completedAt))
    if (day) day.todos.push(todo)
  })

  return days.map((day) => ({
    ...day,
    todos: day.todos.sort(
      (left, right) =>
        parseISO(left.completedAt).getTime() -
        parseISO(right.completedAt).getTime(),
    ),
    level: getActivityLevel(day.todos.length),
  }))
}

export function getMyWeekRangeLabel(days: MyWeekDay[]) {
  if (days.length === 0) return ''
  const firstDay = days[0].date
  const lastDay = days[days.length - 1].date
  const sameYear = firstDay.getFullYear() === lastDay.getFullYear()
  const start = format(firstDay, sameYear ? 'MMM d' : 'MMM d, yyyy')
  const end = format(lastDay, sameYear ? 'MMM d' : 'MMM d, yyyy')
  return `${start} – ${end}`
}

export function getMyWeekDayLabel(date: Date) {
  return format(date, 'EEEE, MMM d')
}

export function getMyWeekCompletionTime(completedAt: string) {
  return format(parseISO(completedAt), 'h:mm a')
}
