import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useParams } from 'react-router'
import { useToast } from '@/app/providers/toast'
import { getErrorMessage } from '@/shared/api/errors'
import { useSprintBoard } from '@/features/sprints/hooks/useSprintBoard'
import { useSprints } from '@/features/sprints/hooks/useSprints'
import { TODO_STATUSES } from '@/shared/types/api'
import { FocusTimerContext, type FocusTimerContextValue } from './FocusTimerContext'
import type { FocusTask, FocusTimerState } from './focus-timer.types'

const MINUTE = 60_000
const SECOND = 1_000
const FOCUS_DURATION_DEFAULT = 25
const BREAK_DURATION_DEFAULT = 5
const FOCUS_DURATION_MAX = 180
const BREAK_DURATION_MAX = 60

function initialTimer(): FocusTimerState {
  return {
    task: null,
    mode: 'focus',
    status: 'idle',
    remainingMs: FOCUS_DURATION_DEFAULT * MINUTE,
    endsAt: null,
    focusMinutes: FOCUS_DURATION_DEFAULT,
    breakMinutes: BREAK_DURATION_DEFAULT,
    cycleMinutes: FOCUS_DURATION_DEFAULT,
    focusPoints: 0,
    sessions: [],
    breakAvailable: false,
  }
}

function storageKey(userId: string) {
  return `kanbot:focus-timer:${encodeURIComponent(userId)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidTask(value: unknown): value is FocusTask {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.key === 'string' &&
    typeof value.title === 'string' &&
    typeof value.projectId === 'string' &&
    (typeof value.sprintId === 'string' || value.sprintId === null)
  )
}

function isValidSession(value: unknown): value is FocusTimerState['sessions'][number] {
  return (
    isRecord(value) &&
    typeof value.taskId === 'string' &&
    typeof value.taskKey === 'string' &&
    typeof value.taskTitle === 'string' &&
    typeof value.sprintId === 'string' &&
    typeof value.startedAt === 'number' &&
    typeof value.completedAt === 'number' &&
    typeof value.durationMinutes === 'number'
  )
}

function loadTimer(key: string | null): { timer: FocusTimerState; error: string } {
  if (!key) return { timer: initialTimer(), error: '' }
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return { timer: initialTimer(), error: '' }

    const value: unknown = JSON.parse(stored)
    if (
      !isRecord(value) ||
      (value.task !== null && !isValidTask(value.task)) ||
      (value.mode !== 'focus' && value.mode !== 'break') ||
      (value.status !== 'idle' && value.status !== 'running') ||
      typeof value.remainingMs !== 'number' ||
      !Number.isFinite(value.remainingMs) ||
      typeof value.focusMinutes !== 'number' ||
      !Number.isFinite(value.focusMinutes) ||
      typeof value.breakMinutes !== 'number' ||
      !Number.isFinite(value.breakMinutes) ||
      typeof value.cycleMinutes !== 'number' ||
      !Number.isFinite(value.cycleMinutes) ||
      typeof value.focusPoints !== 'number' ||
      !Number.isInteger(value.focusPoints) ||
      !Array.isArray(value.sessions) ||
      !value.sessions.every(isValidSession)
    ) {
      return {
        timer: initialTimer(),
        error: 'Saved focus timer data was invalid and has been reset.',
      }
    }

    const timer: FocusTimerState = {
      task: value.task,
      mode: 'focus',
      status: 'idle',
      remainingMs: Math.min(FOCUS_DURATION_MAX, Math.max(1, value.focusMinutes)) * MINUTE,
      endsAt: null,
      focusMinutes: Math.min(FOCUS_DURATION_MAX, Math.max(1, value.focusMinutes)),
      breakMinutes: Math.min(BREAK_DURATION_MAX, Math.max(1, value.breakMinutes)),
      cycleMinutes: Math.min(FOCUS_DURATION_MAX, Math.max(1, value.focusMinutes)),
      focusPoints: Math.max(0, value.focusPoints),
      sessions: value.sessions,
      breakAvailable: false,
    }

    return { timer, error: '' }
  } catch {
    return {
      timer: initialTimer(),
      error: 'The saved focus timer could not be read from this browser.',
    }
  }
}

function advanceTimer(timer: FocusTimerState, now: number): FocusTimerState {
  if (timer.status !== 'running' || timer.endsAt === null || !timer.task) {
    return timer
  }

  let next = timer
  let endsAt = timer.endsAt
  while (endsAt <= now) {
    if (next.mode === 'focus') {
      const task = next.task
      if (!task) return next
      const completedAt = endsAt
      const durationMinutes = next.cycleMinutes
      next = {
        ...next,
        focusPoints: next.focusPoints + 1,
        sessions: [
          ...next.sessions,
          {
            taskId: task.id,
            taskKey: task.key,
            taskTitle: task.title,
            sprintId: task.sprintId ?? '',
            startedAt: completedAt - durationMinutes * MINUTE,
            completedAt,
            durationMinutes,
          },
        ],
        breakAvailable: true,
        cycleMinutes: next.focusMinutes,
      }
      endsAt += next.cycleMinutes * MINUTE
    } else {
      next = {
        ...next,
        mode: 'focus',
        breakAvailable: false,
        cycleMinutes: next.focusMinutes,
      }
      endsAt += next.cycleMinutes * MINUTE
    }
  }

  return { ...next, endsAt, remainingMs: Math.max(0, endsAt - now) }
}

function beginTask(timer: FocusTimerState, task: FocusTask): FocusTimerState {
  const durationMs = timer.focusMinutes * MINUTE
  return {
    ...timer,
    task,
    mode: 'focus',
    status: 'running',
    remainingMs: durationMs,
    endsAt: Date.now() + durationMs,
    cycleMinutes: timer.focusMinutes,
    breakAvailable: false,
  }
}

function stopRunningSession(timer: FocusTimerState): FocusTimerState {
  if (timer.status !== 'running') return timer
  return {
    ...timer,
    mode: 'focus',
    status: 'idle',
    remainingMs: timer.focusMinutes * MINUTE,
    endsAt: null,
    breakAvailable: false,
  }
}

export function FocusTimerProvider({
  userId,
  children,
}: {
  userId: string | null
  children: ReactNode
}) {
  const { projectId } = useParams()
  const showToast = useToast()
  const sprintsQuery = useSprints(projectId ?? '')
  const activeSprint =
    sprintsQuery.data?.sprints.find((sprint) => sprint.status === 'active') ?? null
  const activeSprintId = activeSprint?.id
  const hasActiveSprint = activeSprint !== null
  const boardQuery = useSprintBoard(activeSprintId)
  const refetchSprints = sprintsQuery.refetch
  const refetchBoard = boardQuery.refetch
  const activeSprintTasks = useMemo(
    () =>
      boardQuery.data
        ? TODO_STATUSES.filter((status) => status !== 'done').flatMap(
            (status) => boardQuery.data!.columns[status],
          )
        : [],
    [boardQuery.data],
  )
  const key = userId ? storageKey(userId) : null
  const [initial] = useState(() => loadTimer(key))
  const [timer, setTimer] = useState(initial.timer)
  const timerRef = useRef(timer)
  const [storageError, setStorageError] = useState(initial.error)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState(initial.timer.task?.id ?? '')
  const [pendingTask, setPendingTask] = useState<FocusTask | null>(null)

  const updateTimer = useCallback((update: (current: FocusTimerState) => FocusTimerState) => {
    const next = update(timerRef.current)
    timerRef.current = next
    setTimer(next)
  }, [])

  useEffect(() => {
    if (!key) return
    try {
      window.localStorage.setItem(key, JSON.stringify(timer))
      if (storageError) window.setTimeout(() => setStorageError(''), 0)
    } catch {
      window.setTimeout(
        () => setStorageError('The timer is running, but its state could not be saved in this browser.'),
        0,
      )
    }
  }, [key, storageError, timer])

  useEffect(() => {
    if (!key) return

    const stopAndSave = (reportError: boolean) => {
      const stopped = stopRunningSession(timerRef.current)
      timerRef.current = stopped
      try {
        window.localStorage.setItem(key, JSON.stringify(stopped))
      } catch {
        if (reportError) {
          setStorageError('The current focus session could not be saved before closing the page.')
        }
      }
    }
    const stopWhenPageCloses = () => {
      stopAndSave(true)
    }

    window.addEventListener('pagehide', stopWhenPageCloses)
    return () => {
      window.removeEventListener('pagehide', stopWhenPageCloses)
      stopAndSave(false)
    }
  }, [key])

  const startTask = useCallback(
    (task: FocusTask) => {
      if (!userId || !key || !task.sprintId || task.id === '') return
      setIsOpen(true)
      setSelectedTaskId(task.id)
      const current = timerRef.current
      if (current.status === 'running' && current.task?.id !== task.id) {
        setPendingTask(task)
        return
      }
      if (current.status === 'running') return
      setPendingTask(null)
      updateTimer((state) => beginTask(state, task))
    },
    [key, updateTimer, userId],
  )

  const startSelectedTask = useCallback(() => {
    const task = activeSprintTasks.find((item) => item.id === selectedTaskId)
    if (task) startTask(task)
  }, [activeSprintTasks, selectedTaskId, startTask])

  const confirmTaskSwitch = useCallback(() => {
    if (!pendingTask) return
    updateTimer((current) => beginTask(current, pendingTask))
    setSelectedTaskId(pendingTask.id)
    setPendingTask(null)
  }, [pendingTask, updateTimer])

  const cancelTaskSwitch = useCallback(() => {
    setPendingTask(null)
    if (timerRef.current.task) {
      setSelectedTaskId(timerRef.current.task.id)
    }
  }, [])

  const startBreak = useCallback(() => {
    updateTimer((current) => {
      if (current.status !== 'running' || current.mode !== 'focus') return current
      const durationMs = current.breakMinutes * MINUTE
      return {
        ...current,
        mode: 'break',
        remainingMs: durationMs,
        endsAt: Date.now() + durationMs,
        breakAvailable: false,
      }
    })
  }, [updateTimer])

  const stopFocus = useCallback(() => {
    updateTimer((current) => stopRunningSession(current))
    setPendingTask(null)
  }, [updateTimer])

  useEffect(() => {
    if (timer.status !== 'running') return

    const interval = window.setInterval(() => {
      const current = timerRef.current
      const taskIsStillActive =
        current.task?.sprintId === activeSprintId &&
        activeSprintTasks.some((task) => task.id === current.task?.id)
      const sprintDataReady =
        current.task?.projectId === projectId &&
        sprintsQuery.isSuccess &&
        !sprintsQuery.isFetching &&
        (!hasActiveSprint || (boardQuery.isSuccess && !boardQuery.isFetching))

      if (sprintDataReady && !taskIsStillActive) {
        updateTimer(stopRunningSession)
        showToast('Focus stopped because this task is no longer in the active sprint.', 'info')
        return
      }

      const next = advanceTimer(current, Date.now())
      if (next.focusPoints > current.focusPoints && current.task) {
        showToast(`Focus point earned for ${current.task.key}.`, 'success')
      }
      updateTimer(() => next)
    }, SECOND)

    return () => window.clearInterval(interval)
  }, [
    activeSprintId,
    activeSprintTasks,
    boardQuery.isFetching,
    boardQuery.isSuccess,
    hasActiveSprint,
    projectId,
    showToast,
    sprintsQuery.isFetching,
    sprintsQuery.isSuccess,
    timer.status,
    updateTimer,
  ])

  const setFocusMinutes = useCallback(
    (minutes: number) => {
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > FOCUS_DURATION_MAX) return
      updateTimer((current) => {
        const next = { ...current, focusMinutes: minutes }
        if (current.status === 'running' || current.mode !== 'focus') return next
        const remainingMs = minutes * MINUTE
        return {
          ...next,
          cycleMinutes: minutes,
          remainingMs,
          endsAt: null,
        }
      })
    },
    [updateTimer],
  )

  const setBreakMinutes = useCallback(
    (minutes: number) => {
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > BREAK_DURATION_MAX) return
      updateTimer((current) => {
        const next = { ...current, breakMinutes: minutes }
        if (current.status === 'running' || current.mode !== 'break') return next
        const remainingMs = minutes * MINUTE
        return {
          ...next,
          remainingMs,
          endsAt: null,
        }
      })
    },
    [updateTimer],
  )
  const retryTasks = useCallback(() => {
    void refetchSprints()
    void refetchBoard()
  }, [refetchBoard, refetchSprints])

  const tasksError = sprintsQuery.isError
    ? getErrorMessage(sprintsQuery.error)
    : boardQuery.isError
      ? getErrorMessage(boardQuery.error)
      : ''
  const value: FocusTimerContextValue = {
    userId,
    timer,
    storageError,
    isOpen,
    setIsOpen,
    activeSprintTasks,
    activeSprintName: activeSprint?.name ?? null,
    isLoadingTasks: sprintsQuery.isLoading || boardQuery.isLoading,
    tasksError,
    retryTasks,
    selectedTaskId,
    setSelectedTaskId,
    pendingTask,
    startTask,
    startSelectedTask,
    confirmTaskSwitch,
    cancelTaskSwitch,
    startBreak,
    stopFocus,
    setFocusMinutes,
    setBreakMinutes,
  }

  return (
    <FocusTimerContext.Provider value={value}>
      {children}
    </FocusTimerContext.Provider>
  )
}
