import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'

export function getDefaultSprintDates() {
  const start = new Date()
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(addDays(start, 14), 'yyyy-MM-dd'),
  }
}

export function formatSprintDates(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return 'Dates not set'
  if (!startDate) return `Ends ${format(parseISO(endDate!), 'MMM d')}`
  if (!endDate) return `Starts ${format(parseISO(startDate), 'MMM d')}`
  return `${format(parseISO(startDate), 'MMM d')} – ${format(parseISO(endDate), 'MMM d')}`
}

export function getSprintTimeRemaining(endDate: string | null) {
  if (!endDate) return null
  const days = differenceInCalendarDays(parseISO(endDate), new Date())
  if (days < 0) return { days, label: `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} overdue` }
  if (days === 0) return { days, label: 'Ends today' }
  return { days, label: `${days} ${days === 1 ? 'day' : 'days'} left` }
}
