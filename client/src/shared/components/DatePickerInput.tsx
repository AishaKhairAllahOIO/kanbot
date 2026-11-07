import { useMemo, useState } from 'react'
import { addDays, addMonths, format, isBefore, isSameDay, isSameMonth, isValid, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import * as Popover from '@radix-ui/react-popover'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerInputProps {
  id: string
  value?: string
  min?: string
  invalid?: boolean
  disabled?: boolean
  'aria-describedby'?: string
  onValueChange: (value: string) => void
}

function parseDate(value?: string) {
  if (!value) return null
  const date = parseISO(value)
  return isValid(date) ? date : null
}

function toDateValue(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

export function DatePickerInput({
  id,
  value = '',
  min,
  invalid = false,
  disabled = false,
  'aria-describedby': describedBy,
  onValueChange,
}: DatePickerInputProps) {
  const selectedDate = parseDate(value)
  const minDate = parseDate(min)
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(
    () => startOfMonth(selectedDate ?? minDate ?? new Date()),
  )
  const days = useMemo(() => {
    const firstDay = startOfWeek(startOfMonth(visibleMonth))
    return Array.from({ length: 42 }, (_, index) => addDays(firstDay, index))
  }, [visibleMonth])

  function chooseDate(date: Date) {
    onValueChange(toDateValue(date))
    setVisibleMonth(startOfMonth(date))
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy ?? (invalid ? `${id}-error` : undefined)}
          aria-haspopup="dialog"
          className={`flex min-h-9 w-full items-center gap-2 rounded-sm border bg-surface px-3 text-start text-body transition-[border-color,box-shadow] duration-fast hover:border-brand/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-sunken disabled:text-muted ${
            invalid ? 'border-danger' : 'border-line-strong'
          }`}
        >
          <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted" />
          <span className={selectedDate ? 'text-ink' : 'text-subtle'}>
            {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Choose a date'}
          </span>
          <ChevronDown aria-hidden="true" className="ms-auto size-4 shrink-0 text-muted" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-popover w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-content-available-width)] rounded-md border border-line bg-raised p-3 shadow-pop outline-none"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-small font-semibold text-ink">{format(visibleMonth, 'MMMM yyyy')}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
                className="grid size-8 place-content-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-ink"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
                className="grid size-8 place-content-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-ink"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {Array.from({ length: 7 }, (_, index) => {
              const weekday = addDays(startOfWeek(new Date()), index)
              return (
                <span key={index} className="grid h-8 place-content-center text-caption font-medium text-muted">
                  {format(weekday, 'EEEEE')}
                </span>
              )
            })}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day) => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
              const isOutsideMonth = !isSameMonth(day, visibleMonth)
              const isDisabled = Boolean(minDate && isBefore(day, minDate))

              return (
                <button
                  key={toDateValue(day)}
                  type="button"
                  aria-label={format(day, 'MMMM d, yyyy')}
                  aria-pressed={isSelected}
                  disabled={isDisabled}
                  onClick={() => chooseDate(day)}
                  className={`mx-auto grid size-8 place-content-center rounded-full text-small tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSelected
                      ? 'bg-brand text-on-brand'
                      : isOutsideMonth
                        ? 'text-subtle hover:bg-sunken'
                        : 'text-ink hover:bg-brand-soft hover:text-brand-ink'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-2">
            <button
              type="button"
              onClick={() => {
                onValueChange('')
                setOpen(false)
              }}
              disabled={!value}
              className="rounded-sm px-2 py-1 text-small font-medium text-muted transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => chooseDate(new Date())}
              disabled={Boolean(minDate && isBefore(new Date(), minDate))}
              className="rounded-sm px-2 py-1 text-small font-medium text-brand-ink transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              Today
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
