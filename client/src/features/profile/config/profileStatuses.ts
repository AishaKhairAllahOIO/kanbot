import {
  Brain,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Coffee,
  Eye,
} from 'lucide-react'
import type {
  ProfileStatusClearAfter,
  ProfileStatusId,
} from '../hooks/ProfileStatusContext'

export const profileStatuses: {
  id: ProfileStatusId
  label: string
  color: string
  icon: typeof Brain
}[] = [
  { id: 'deep-work', label: 'Deep work', color: 'bg-violet-500', icon: Brain },
  { id: 'planning-sprint', label: 'Planning sprint', color: 'bg-blue-500', icon: CalendarDays },
  { id: 'reviewing', label: 'Reviewing', color: 'bg-pink-600', icon: Eye },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-600', icon: CircleAlert },
  { id: 'on-break', label: 'On a break', color: 'bg-amber-600', icon: Coffee },
  { id: 'done-today', label: 'Done for today', color: 'bg-green-700', icon: CircleCheck },
]

export const profileStatusClearAfterOptions: {
  value: ProfileStatusClearAfter
  label: string
}[] = [
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '4h', label: '4 hours' },
  { value: 'today', label: 'Today' },
  { value: 'never', label: 'Never' },
]

export function getProfileStatusLabel(statusId: ProfileStatusId | undefined) {
  return profileStatuses.find(({ id }) => id === statusId)?.label ?? 'Set your status'
}
