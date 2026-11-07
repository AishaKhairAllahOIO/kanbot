import { useState } from 'react'
import { CalendarDays, Check } from 'lucide-react'
import { format } from 'date-fns'
import { getErrorMessage } from '@/shared/api/errors'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { Modal } from '@/shared/components/Modal'
import { Skeleton } from '@/shared/components/Skeleton'
import { useMyWeekActivity } from '../hooks/useMyWeekActivity'
import {
  getMyWeekCompletionTime,
  getMyWeekDayLabel,
  getMyWeekDayKey,
  getMyWeekRangeLabel,
} from '../utils/myWeekActivity'

const levelBackgrounds = [
  'var(--surface-sunken)',
  'color-mix(in srgb, var(--brand) 18%, var(--surface))',
  'color-mix(in srgb, var(--brand) 40%, var(--surface))',
  'color-mix(in srgb, var(--brand) 70%, var(--surface))',
  'var(--brand)',
] as const

function ActivityLegend() {
  return (
    <div className="flex items-center justify-end gap-1.5" aria-label="Activity legend">
      <span className="text-caption text-muted">Less</span>
      {levelBackgrounds.map((background, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="size-3 rounded-xs border border-line"
          style={{ background }}
        />
      ))}
      <span className="text-caption text-muted">More</span>
    </div>
  )
}

export function MyWeekSection() {
  const { days, error, isLoading, refetch } = useMyWeekActivity()
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)
  const selectedDay = days.find((day) => day.dateKey === selectedDayKey) ?? null
  const totalCompleted = days.reduce((sum, day) => sum + day.todos.length, 0)
  const todayKey = getMyWeekDayKey(new Date())

  return (
    <section
      aria-labelledby="my-week-heading"
      className="theme-card grid gap-5 rounded-lg border border-line p-5 sm:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-ink">
            <CalendarDays aria-hidden="true" className="size-4" />
            <span>My week</span>
          </div>
          <h2
            id="my-week-heading"
            className="font-heading text-heading font-semibold text-ink"
          >
            {isLoading ? (
              <Skeleton className="h-6 w-60" />
            ) : (
              `You completed ${totalCompleted} todos this week`
            )}
          </h2>
          <p className="text-small text-muted">Tap a day to see what you finished.</p>
        </div>
        <span className="shrink-0 rounded-full border border-line bg-surface px-2.5 py-1 text-caption font-medium tabular-nums text-muted">
          {getMyWeekRangeLabel(days)}
        </span>
      </header>

      {error ? (
        <EmptyState
          title="Weekly activity could not be loaded"
          description={getErrorMessage(error)}
          error
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-1" role="status" aria-label="Loading weekly activity">
          {days.map((day) => (
            <div key={day.dateKey} className="grid justify-items-center gap-2">
              <Skeleton className="size-14 rounded-xl" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[28rem] grid-cols-7 gap-2 sm:gap-3">
              {days.map((day) => {
                const isToday = day.dateKey === todayKey
                const isSelected = day.dateKey === selectedDayKey
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    aria-label={`${getMyWeekDayLabel(day.date)}: ${day.todos.length} completed ${day.todos.length === 1 ? 'todo' : 'todos'}${isToday ? ', today' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDayKey(day.dateKey)}
                    className="group grid justify-items-center gap-1 rounded-md text-center outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    <span
                      className={`grid size-14 place-content-center rounded-xl border border-line/60 text-body font-semibold tabular-nums transition-shadow ${
                        isSelected ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface' : ''
                      } ${day.level >= 3 ? 'text-white' : 'text-ink'}`}
                      style={{ background: levelBackgrounds[day.level] }}
                    >
                      {day.todos.length}
                    </span>
                    <span className={`text-caption ${isToday ? 'font-semibold text-brand-ink' : 'text-muted'}`}>
                      {format(day.date, 'EEE')}
                    </span>
                    <span className={`text-caption tabular-nums ${isToday ? 'font-semibold text-brand-ink' : 'text-subtle'}`}>
                      {day.date.getDate()}
                      {isToday ? <span className="sr-only">, Today</span> : null}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <ActivityLegend />
        </>
      )}

      <Modal
        open={selectedDay !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDayKey(null)
        }}
        title={selectedDay ? getMyWeekDayLabel(selectedDay.date) : ''}
        description={
          selectedDay
            ? `${selectedDay.todos.length} completed ${selectedDay.todos.length === 1 ? 'todo' : 'todos'}`
            : undefined
        }
        size="form"
        bodyClassName="min-h-0 flex-1 overflow-y-auto px-6 py-3"
      >
        {selectedDay && (
          selectedDay.todos.length > 0 ? (
            <ul className="divide-y divide-line">
              {selectedDay.todos.map((todo) => (
                <li key={todo.id} className="flex items-center gap-3 py-3">
                  <Check aria-hidden="true" className="size-4 shrink-0 text-success" />
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-small font-medium text-ink">{todo.title}</span>
                    <span className="truncate text-caption text-muted">{todo.projectName}</span>
                  </div>
                  <time
                    dateTime={todo.completedAt}
                    className="shrink-0 text-caption tabular-nums text-subtle"
                  >
                    {getMyWeekCompletionTime(todo.completedAt)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-small text-muted">
              No todos completed on this day.
            </p>
          )
        )}
      </Modal>
    </section>
  )
}
