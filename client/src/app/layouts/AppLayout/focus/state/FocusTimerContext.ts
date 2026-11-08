import { createContext, useContext } from 'react'
import type { Todo } from '@/shared/types/api'
import type { FocusTimerState, FocusTask } from './focus-timer.types'

export interface FocusTimerContextValue {
  userId: string | null
  timer: FocusTimerState
  storageError: string
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  activeSprintTasks: Todo[]
  activeSprintName: string | null
  isLoadingTasks: boolean
  tasksError: string
  retryTasks: () => void
  selectedTaskId: string
  setSelectedTaskId: (todoId: string) => void
  pendingTask: FocusTask | null
  startTask: (task: FocusTask) => void
  startSelectedTask: () => void
  confirmTaskSwitch: () => void
  cancelTaskSwitch: () => void
  startBreak: () => void
  stopFocus: () => void
  setFocusMinutes: (minutes: number) => void
  setBreakMinutes: (minutes: number) => void
}

export const FocusTimerContext = createContext<FocusTimerContextValue | null>(null)

export function useFocusTimer() {
  const context = useContext(FocusTimerContext)
  if (!context) {
    throw new Error('useFocusTimer must be used within a FocusTimerProvider.')
  }
  return context
}
