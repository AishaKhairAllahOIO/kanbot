import { useEffect, useState } from 'react'
import { Coffee, Pause, Play, RotateCcw, Timer, X } from 'lucide-react'
import { FocusCoffeeIllustration } from './focus-illustrations/FocusCoffeeIllustration'
import { FocusPlantIllustration } from './focus-illustrations/FocusPlantIllustration'

type FocusMode = 'focus' | 'shortBreak' | 'longBreak'
type TimerStatus = 'idle' | 'running' | 'paused'

interface FocusTimerState {
  mode: FocusMode
  status: TimerStatus
  remainingMs: number
  endsAt: number | null
  completedFocusSessions: number
  completed: boolean
}

const STORAGE_KEY = 'kanbot:focus-timer'
const SECOND = 1000
const MODE_DURATIONS: Record<FocusMode, number> = {
  focus: 25 * 60 * SECOND,
  shortBreak: 5 * 60 * SECOND,
  longBreak: 15 * 60 * SECOND,
}

function createInitialState(): FocusTimerState {
  return {
    mode: 'focus',
    status: 'idle',
    remainingMs: MODE_DURATIONS.focus,
    endsAt: null,
    completedFocusSessions: 0,
    completed: false,
  }
}

function isFocusMode(value: unknown): value is FocusMode {
  return value === 'focus' || value === 'shortBreak' || value === 'longBreak'
}

function loadTimerState(): { timer: FocusTimerState; error: string } {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return { timer: createInitialState(), error: '' }

    const value: unknown = JSON.parse(stored)
    if (!value || typeof value !== 'object') {
      return { timer: createInitialState(), error: 'Saved timer data was invalid and has been reset.' }
    }

    const saved = value as Partial<FocusTimerState>
    if (
      !isFocusMode(saved.mode) ||
      (saved.status !== 'idle' && saved.status !== 'running' && saved.status !== 'paused') ||
      typeof saved.remainingMs !== 'number' ||
      !Number.isFinite(saved.remainingMs) ||
      typeof saved.completedFocusSessions !== 'number' ||
      !Number.isInteger(saved.completedFocusSessions)
    ) {
      return { timer: createInitialState(), error: 'Saved timer data was invalid and has been reset.' }
    }

    const timer: FocusTimerState = {
      mode: saved.mode,
      status: saved.status,
      remainingMs: Math.max(0, saved.remainingMs),
      endsAt: typeof saved.endsAt === 'number' ? saved.endsAt : null,
      completedFocusSessions: Math.max(0, saved.completedFocusSessions),
      completed: saved.completed === true,
    }

    if (timer.status === 'running' && timer.endsAt !== null) {
      timer.remainingMs = Math.max(0, timer.endsAt - Date.now())
      if (timer.remainingMs === 0) {
        timer.status = 'idle'
        timer.endsAt = null
        timer.completed = true
        if (timer.mode === 'focus') timer.completedFocusSessions += 1
      }
    }

    return { timer, error: '' }
  } catch {
    return {
      timer: createInitialState(),
      error: 'The saved focus timer could not be read from this browser.',
    }
  }
}

function formatTime(milliseconds: number) {
  const totalSeconds = Math.ceil(milliseconds / SECOND)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const modeLabels: Record<FocusMode, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
}

function FocusSessionIllustration({
  isBreak,
  progress,
  time,
  label,
  isRunning,
}: {
  isBreak: boolean
  progress: number
  time: string
  label: string
  isRunning: boolean
}) {
  return (
    <div className="grid justify-items-center gap-2">
      <div className="grid size-36 place-content-center rounded-full bg-sunken/70">
        {isBreak ? (
          <FocusCoffeeIllustration progress={progress} isRunning={isRunning} />
        ) : (
          <FocusPlantIllustration progress={progress} isRunning={isRunning} />
        )}
      </div>
      <div className="grid justify-items-center gap-1">
        <span className="font-mono text-title font-semibold tabular-nums text-ink">{time}</span>
        <span className="text-caption text-muted">{label}</span>
        <div
          role="progressbar"
          aria-label="Focus session progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-sunken"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-700 ease-[var(--ease)]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function FocusTimer() {
  const [isOpen, setIsOpen] = useState(false)
  const [initial] = useState(loadTimerState)
  const [timer, setTimer] = useState(initial.timer)
  const [storageError, setStorageError] = useState(initial.error)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(timer))
      if (storageError) window.setTimeout(() => setStorageError(''), 0)
    } catch {
      window.setTimeout(
        () => setStorageError('The timer is running, but its state could not be saved in this browser.'),
        0,
      )
    }
  }, [storageError, timer])

  useEffect(() => {
    if (timer.status !== 'running' || timer.endsAt === null) return

    const interval = window.setInterval(() => {
      const remainingMs = Math.max(0, timer.endsAt! - Date.now())
      if (remainingMs === 0) {
        setTimer((current) => {
          if (current.status !== 'running' || current.endsAt !== timer.endsAt) return current
          return {
            ...current,
            status: 'idle',
            remainingMs: 0,
            endsAt: null,
            completedFocusSessions:
              current.completedFocusSessions + (current.mode === 'focus' ? 1 : 0),
            completed: true,
          }
        })
        return
      }
      setTimer((current) =>
        current.status === 'running' && current.endsAt === timer.endsAt
          ? { ...current, remainingMs }
          : current,
      )
    }, SECOND)

    return () => window.clearInterval(interval)
  }, [timer.endsAt, timer.status])

  const start = () => {
    setTimer((current) => {
      const remainingMs = current.remainingMs > 0
        ? current.remainingMs
        : MODE_DURATIONS[current.mode]
      return {
        ...current,
        status: 'running',
        remainingMs,
        endsAt: Date.now() + remainingMs,
        completed: false,
      }
    })
  }

  const pause = () => {
    setTimer((current) => ({
      ...current,
      status: 'paused',
      remainingMs: current.endsAt === null
        ? current.remainingMs
        : Math.max(0, current.endsAt - Date.now()),
      endsAt: null,
    }))
  }

  const reset = () => {
    setTimer((current) => ({
      ...current,
      status: 'idle',
      remainingMs: MODE_DURATIONS[current.mode],
      endsAt: null,
      completed: false,
    }))
  }

  const selectMode = (mode: FocusMode) => {
    setTimer((current) => ({
      ...current,
      mode,
      status: 'idle',
      remainingMs: MODE_DURATIONS[mode],
      endsAt: null,
      completed: false,
    }))
  }

  const startNextSession = () => {
    if (timer.mode === 'focus') {
      const mode = timer.completedFocusSessions % 4 === 0 ? 'longBreak' : 'shortBreak'
      setTimer((current) => ({
        ...current,
        mode,
        status: 'running',
        remainingMs: MODE_DURATIONS[mode],
        endsAt: Date.now() + MODE_DURATIONS[mode],
        completed: false,
      }))
      return
    }

    setTimer((current) => ({
      ...current,
      mode: 'focus',
      status: 'running',
      remainingMs: MODE_DURATIONS.focus,
      endsAt: Date.now() + MODE_DURATIONS.focus,
      completed: false,
    }))
  }

  const progress = timer.completed
    ? 1
    : 1 - timer.remainingMs / MODE_DURATIONS[timer.mode]
  const completedFocus = timer.completed && timer.mode === 'focus'

  return (
    <div className="fixed inset-x-4 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] z-sticky flex justify-end md:inset-x-auto md:bottom-6 md:right-6">
      {isOpen && (
        <section
          aria-label="Focus timer"
          className="absolute bottom-14 right-0 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-surface shadow-modal"
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2 font-heading text-body-strong font-semibold text-ink">
              <Timer aria-hidden="true" className="size-4 text-brand-ink" />
              Focus timer
            </div>
            <button
              type="button"
              aria-label="Close focus timer"
              onClick={() => setIsOpen(false)}
              className="grid size-8 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-ink"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </header>

          <div className="grid gap-4 p-4">
            <div className="grid grid-cols-3 gap-1 rounded-md bg-sunken p-1">
              {(['focus', 'shortBreak', 'longBreak'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={timer.mode === mode}
                  onClick={() => selectMode(mode)}
                  className={`min-h-8 rounded-sm px-1 text-caption font-medium transition-colors ${
                    timer.mode === mode
                      ? 'bg-surface text-brand-ink shadow-card'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {modeLabels[mode]}
                </button>
              ))}
            </div>

            <div className="grid justify-items-center gap-2 py-1">
              <FocusSessionIllustration
                isBreak={timer.mode !== 'focus'}
                progress={Math.max(0, Math.min(1, progress))}
                time={formatTime(timer.remainingMs)}
                isRunning={timer.status === 'running'}
                label={
                  timer.completed
                    ? 'Complete'
                    : timer.status === 'running'
                      ? timer.mode === 'focus' ? 'Growing' : 'Resting'
                      : modeLabels[timer.mode]
                }
              />
              <p className="text-caption text-muted">
                Focus sessions completed: {timer.completedFocusSessions}
              </p>
            </div>

            {timer.completed && (
              <div className="grid gap-2 rounded-md border border-brand-soft-line bg-brand-soft/50 p-3">
                <p className="text-small font-medium text-brand-ink">
                  {completedFocus ? 'Focus session complete. Take a break?' : 'Break complete. Ready to focus?'}
                </p>
                <button
                  type="button"
                  onClick={startNextSession}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-sm bg-brand px-3 text-small font-medium text-on-brand hover:bg-brand-hover"
                >
                  {completedFocus
                    ? <><Coffee aria-hidden="true" className="size-4" /> Start {timer.completedFocusSessions % 4 === 0 ? '15' : '5'} min break</>
                    : <><Play aria-hidden="true" className="size-4" /> Start focus session</>}
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              {timer.status === 'running' ? (
                <button
                  type="button"
                  onClick={pause}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-line-strong px-4 text-small font-medium text-ink hover:bg-sunken"
                >
                  <Pause aria-hidden="true" className="size-4" />
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={start}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-brand px-5 text-small font-medium text-on-brand hover:bg-brand-hover"
                >
                  <Play aria-hidden="true" className="size-4" />
                  {timer.status === 'paused' ? 'Resume' : timer.completed ? 'Start again' : 'Start focus'}
                </button>
              )}
              <button
                type="button"
                aria-label="Reset timer"
                title="Reset timer"
                onClick={reset}
                className="grid size-10 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-ink"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
              </button>
            </div>

            {storageError && (
              <p role="alert" className="text-caption text-danger">{storageError}</p>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close focus timer' : `Open focus timer${timer.status === 'running' ? `, ${formatTime(timer.remainingMs)} remaining` : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 shadow-modal transition-colors ${
          timer.status === 'running'
            ? 'border-brand bg-brand text-on-brand hover:bg-brand-hover'
            : 'border-line-strong bg-surface text-ink hover:bg-sunken'
        }`}
      >
        <Timer aria-hidden="true" className="size-4" />
        <span className="text-small font-semibold tabular-nums">
          {timer.status === 'running' ? formatTime(timer.remainingMs) : 'Focus'}
        </span>
        {timer.completed && (
          <span aria-label="Timer complete" className="size-2 rounded-full bg-success" />
        )}
      </button>
    </div>
  )
}
