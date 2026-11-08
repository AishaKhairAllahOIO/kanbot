import type { Todo } from '@/shared/types/api'

export type FocusTask = Pick<Todo, 'id' | 'key' | 'title' | 'projectId' | 'sprintId'>
type TimerMode = 'focus' | 'break'
type TimerStatus = 'idle' | 'running'

interface FocusSession {
  taskId: string
  taskKey: string
  taskTitle: string
  sprintId: string
  startedAt: number
  completedAt: number
  durationMinutes: number
}

export interface FocusTimerState {
  task: FocusTask | null
  mode: TimerMode
  status: TimerStatus
  remainingMs: number
  endsAt: number | null
  focusMinutes: number
  breakMinutes: number
  cycleMinutes: number
  focusPoints: number
  sessions: FocusSession[]
  breakAvailable: boolean
}
