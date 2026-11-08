import { useState } from 'react'
import { ChevronDown, Coffee, Play, Settings2, Timer, X } from 'lucide-react'
import { SelectInput } from '@/shared/components/Field'
import { useFocusTimer } from './state/FocusTimerContext'
import { FocusCoffeeIllustration } from './illustrations/FocusCoffeeIllustration'
import { FocusPlantIllustration } from './illustrations/FocusPlantIllustration'

const MINUTE = 60_000
const SECOND = 1_000

function formatTime(milliseconds: number) {
  const totalSeconds = Math.ceil(milliseconds / SECOND)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function FocusTimer() {
  const {
    userId,
    timer,
    storageError,
    isOpen,
    setIsOpen,
    activeSprintTasks,
    activeSprintName,
    isLoadingTasks,
    tasksError,
    retryTasks,
    selectedTaskId,
    setSelectedTaskId,
    pendingTask,
    startSelectedTask,
    confirmTaskSwitch,
    cancelTaskSwitch,
    startBreak,
    stopFocus,
    setFocusMinutes,
    setBreakMinutes,
  } = useFocusTimer()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmStop, setConfirmStop] = useState(false)
  const [confirmBreakFor, setConfirmBreakFor] = useState<string | null>(null)
  const [focusMinutesInput, setFocusMinutesInput] = useState<string | null>(null)
  const [breakMinutesInput, setBreakMinutesInput] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState('')

  if (!userId) return null

  const durationMs =
    (timer.mode === 'focus' ? timer.cycleMinutes : timer.breakMinutes) * MINUTE
  const progress =
    timer.status === 'running'
      ? Math.max(0, Math.min(1, 1 - timer.remainingMs / durationMs))
      : 0
  const selectedTaskExists = activeSprintTasks.some(
    (task) => task.id === selectedTaskId,
  )
  const selectedTaskIsRunning =
    timer.status === 'running' && timer.task?.id === selectedTaskId

  return (
    <div className="fixed inset-x-4 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] z-sticky flex justify-end md:inset-x-auto md:bottom-6 md:right-6">
      {isOpen && (
        <section
          aria-label="Task focus timer"
          className="absolute bottom-14 right-0 w-[min(21rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface shadow-modal"
        >
          <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Timer aria-hidden="true" className="size-4 shrink-0 text-brand-ink" />
              <span className="shrink-0 text-small font-semibold text-ink">Focus</span>
              {timer.task && (
                <span className="min-w-0 truncate text-caption text-muted">
                  {timer.task.key} · {timer.task.title}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Close focus timer"
              onClick={() => setIsOpen(false)}
              className="grid size-7 shrink-0 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-ink"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </header>

          <div className="grid gap-3 p-3">
            <div className="grid gap-2">
              <label
                htmlFor="focus-task-select"
                className="text-caption font-medium text-muted"
              >
                {activeSprintName ?? 'Active sprint tasks'}
              </label>
              <SelectInput
                id="focus-task-select"
                value={selectedTaskExists ? selectedTaskId : ''}
                onChange={(event) => setSelectedTaskId(event.target.value)}
                disabled={isLoadingTasks || activeSprintTasks.length === 0}
                className="min-h-9 text-small"
              >
                <option value="">
                  {isLoadingTasks
                    ? 'Loading sprint tasks…'
                    : activeSprintName
                      ? 'Choose a task'
                      : 'No active sprint'}
                </option>
                {activeSprintTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.key} · {task.title}
                  </option>
                ))}
              </SelectInput>
              {tasksError ? (
                <div role="alert" className="flex items-center justify-between gap-2 text-caption text-danger">
                  <span className="min-w-0 truncate">{tasksError}</span>
                  <button
                    type="button"
                    onClick={retryTasks}
                    className="shrink-0 rounded-sm underline underline-offset-2"
                  >
                    Try again
                  </button>
                </div>
              ) : !isLoadingTasks && activeSprintName && activeSprintTasks.length === 0 ? (
                <p className="text-caption text-muted">
                  No unfinished tasks in this sprint.
                </p>
              ) : null}
              {selectedTaskExists && !selectedTaskIsRunning && (
                <button
                  type="button"
                  onClick={startSelectedTask}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-sm bg-brand px-3 text-small font-medium text-on-brand hover:bg-brand-hover"
                >
                  <Play aria-hidden="true" className="size-4" />
                  {timer.status === 'running' ? 'Switch focus task' : 'Start focus'}
                </button>
              )}
            </div>

            {timer.task && (
              <div className="flex min-w-0 items-center gap-3 rounded-md bg-sunken/50 px-3 py-2">
                <div className="grid size-16 shrink-0 place-content-center overflow-hidden rounded-full bg-sunken/70">
                  <div className="h-[66px] w-[62px]">
                    <div className="origin-top-left scale-[0.55]">
                      {timer.mode === 'break' ? (
                        <FocusCoffeeIllustration
                          progress={progress}
                          isRunning={timer.status === 'running'}
                        />
                      ) : (
                        <FocusPlantIllustration
                          progress={progress}
                          isRunning={timer.status === 'running'}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <span className="font-mono text-heading font-semibold tabular-nums text-ink">
                    {formatTime(timer.remainingMs)}
                  </span>
                  <span className="text-caption text-muted">
                    {timer.status === 'running'
                      ? timer.mode === 'focus'
                        ? 'Focusing'
                        : 'Break'
                      : 'Stopped'}
                  </span>
                  <span className="text-caption font-medium text-brand-ink">
                    {timer.focusPoints} focus {timer.focusPoints === 1 ? 'point' : 'points'}
                  </span>
                </div>
                {timer.status === 'running' && timer.mode === 'focus' && (
                  <button
                    type="button"
                    onClick={() => setConfirmBreakFor(`${timer.task?.id}:${timer.endsAt}`)}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-sm border border-line-strong px-2 text-caption font-medium text-ink hover:bg-surface"
                  >
                    <Coffee aria-hidden="true" className="size-4" />
                    Break
                  </button>
                )}
              </div>
            )}

            {confirmBreakFor === `${timer.task?.id}:${timer.endsAt}` &&
              timer.status === 'running' &&
              timer.mode === 'focus' && (
              <div className="grid gap-2 rounded-md border border-warning bg-warning/10 p-2.5">
                <p className="text-caption text-ink">
                  Starting a break now will interrupt this focus interval. It won’t earn a point.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmBreakFor(null)}
                    className="min-h-8 rounded-sm px-2 text-caption text-muted hover:bg-sunken"
                  >
                    Keep focusing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startBreak()
                      setConfirmBreakFor(null)
                    }}
                    className="min-h-8 rounded-sm bg-brand px-2 text-caption font-medium text-on-brand hover:bg-brand-hover"
                  >
                    Start break
                  </button>
                </div>
              </div>
            )}

            {timer.breakAvailable && timer.status === 'running' && (
              <p className="text-caption font-medium text-brand-ink">
                Focus complete — 1 point earned.
              </p>
            )}

            {pendingTask && (
              <div className="grid gap-2 rounded-md border border-warning bg-warning/10 p-2.5">
                <p className="text-caption text-ink">
                  Switch to {pendingTask.key}? The unfinished focus interval will be discarded.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelTaskSwitch}
                    className="min-h-8 rounded-sm px-2 text-caption text-muted hover:bg-sunken"
                  >
                    Keep current
                  </button>
                  <button
                    type="button"
                    onClick={confirmTaskSwitch}
                    className="min-h-8 rounded-sm bg-brand px-2 text-caption font-medium text-on-brand hover:bg-brand-hover"
                  >
                    Switch task
                  </button>
                </div>
              </div>
            )}

            {timer.status === 'running' && timer.mode === 'break' && (
              <p className="text-center text-caption text-muted">
                Focus resumes when the break ends.
              </p>
            )}

            {timer.status === 'running' && (
              confirmStop ? (
                <div className="grid gap-2 rounded-md bg-warning/10 p-2.5">
                  <p className="text-caption text-ink">
                    Stop and discard the unfinished interval? Earned points stay saved.
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmStop(false)}
                      className="min-h-8 rounded-sm px-2 text-caption text-muted hover:bg-sunken"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopFocus()
                        setConfirmStop(false)
                      }}
                      className="min-h-8 rounded-sm bg-danger px-2 text-caption font-medium text-on-brand hover:opacity-90"
                    >
                      Stop focus
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmStop(true)}
                  className="min-h-8 justify-self-center rounded-sm px-3 text-caption font-medium text-danger hover:bg-danger/10"
                >
                  Stop focus
                </button>
              )
            )}

            <div className="border-t border-line pt-2">
              <button
                type="button"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((open) => !open)}
                className="flex min-h-8 w-full items-center justify-between rounded-sm px-1 text-caption font-medium text-muted hover:bg-sunken hover:text-ink"
              >
                <span className="flex items-center gap-2">
                  <Settings2 aria-hidden="true" className="size-4" />
                  Timer settings
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`size-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {settingsOpen && (
                <div className="grid gap-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-caption text-muted">
                      Focus (min)
                      <input
                        type="number"
                        min={1}
                        max={180}
                        step={1}
                        value={focusMinutesInput ?? String(timer.focusMinutes)}
                        onChange={(event) => {
                          setFocusMinutesInput(event.target.value)
                          setSettingsError('')
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return
                          event.preventDefault()
                          const minutes = Number(focusMinutesInput ?? timer.focusMinutes)
                          if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
                            setSettingsError('Focus must be between 1 and 180 minutes.')
                            return
                          }
                          setFocusMinutes(minutes)
                          setFocusMinutesInput(null)
                          setSettingsError('')
                        }}
                        aria-label="Focus duration in minutes. Press Enter to apply."
                        className="min-h-8 w-full rounded-sm border border-line-strong bg-surface px-2 text-small text-ink"
                      />
                    </label>
                    <label className="grid gap-1 text-caption text-muted">
                      Break (min)
                      <input
                        type="number"
                        min={1}
                        max={60}
                        step={1}
                        value={breakMinutesInput ?? String(timer.breakMinutes)}
                        onChange={(event) => {
                          setBreakMinutesInput(event.target.value)
                          setSettingsError('')
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return
                          event.preventDefault()
                          const minutes = Number(breakMinutesInput ?? timer.breakMinutes)
                          if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) {
                            setSettingsError('Break must be between 1 and 60 minutes.')
                            return
                          }
                          setBreakMinutes(minutes)
                          setBreakMinutesInput(null)
                          setSettingsError('')
                        }}
                        aria-label="Break duration in minutes. Press Enter to apply."
                        className="min-h-8 w-full rounded-sm border border-line-strong bg-surface px-2 text-small text-ink"
                      />
                    </label>
                  </div>
                  <p className="text-caption text-muted">
                    {timer.status === 'running'
                      ? 'Press Enter to apply. Changes take effect in the next focus or break session.'
                      : 'Press Enter to apply. A focus duration change resets the idle timer.'}
                  </p>
                  {settingsError && (
                    <p role="alert" className="text-caption text-danger">{settingsError}</p>
                  )}
                </div>
              )}
            </div>

            {storageError && (
              <p role="alert" className="text-caption text-danger">
                {storageError}
              </p>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={
          isOpen
            ? 'Close focus timer'
            : `Open focus timer${timer.status === 'running' ? `, ${formatTime(timer.remainingMs)} remaining` : ''}`
        }
        onClick={() => setIsOpen(!isOpen)}
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
      </button>
    </div>
  )
}
