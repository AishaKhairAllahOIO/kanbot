import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown, Clock3 } from 'lucide-react'
import { Field, SelectInput } from '@/shared/components/Field'

interface ReminderTimePickerProps {
  value: string
  onChange: (value: string) => void
}

const hours = Array.from({ length: 12 }, (_, index) => index + 1)
const minutes = Array.from({ length: 60 }, (_, index) => index)

function parseTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  const hour24 = match ? Number(match[1]) : 9
  return {
    hour: hour24 % 12 || 12,
    minute: match ? Number(match[2]) : 0,
    period: hour24 >= 12 ? 'PM' : 'AM',
  }
}

export function ReminderTimePicker({ value, onChange }: ReminderTimePickerProps) {
  const [open, setOpen] = useState(false)
  const time = parseTime(value)
  const displayTime = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')} ${time.period}`

  function updateTime(hour: number, minute: number, period: string) {
    const hour24 = (hour % 12) + (period === 'PM' ? 12 : 0)
    onChange(`${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Choose reminder time, ${displayTime}`}
          aria-haspopup="dialog"
          className="flex min-h-9 w-full items-center gap-3 rounded-sm border border-line-strong bg-surface px-3 text-start transition-colors hover:border-brand/50 hover:bg-sunken/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className="flex-1 font-medium tabular-nums text-ink">{displayTime}</span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-popover w-72 rounded-md border border-line bg-raised p-4 shadow-pop outline-none"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-content-center rounded-md bg-brand-soft text-brand-ink">
              <Clock3 aria-hidden="true" className="size-5" />
            </span>
            <div className="grid gap-0.5">
              <h3 className="text-small font-semibold text-ink">Choose a time</h3>
              <p className="text-caption text-muted">Uses your device's local time</p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1fr_0.85fr] gap-2">
            <Field id="reminder-hour" label="Hour">
              <SelectInput
                id="reminder-hour"
                value={time.hour}
                onChange={(event) => updateTime(Number(event.target.value), time.minute, time.period)}
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </SelectInput>
            </Field>
            <Field id="reminder-minute" label="Minute">
              <SelectInput
                id="reminder-minute"
                value={time.minute}
                onChange={(event) => updateTime(time.hour, Number(event.target.value), time.period)}
              >
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>
                ))}
              </SelectInput>
            </Field>
            <Field id="reminder-period" label="AM/PM">
              <SelectInput
                id="reminder-period"
                value={time.period}
                onChange={(event) => updateTime(time.hour, time.minute, event.target.value)}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </SelectInput>
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-caption text-muted">Selected time</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-small font-semibold tabular-nums text-brand-ink">
              <Check aria-hidden="true" className="size-3.5" />
              {displayTime}
            </span>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
