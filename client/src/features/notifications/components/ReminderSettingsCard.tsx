import { useEffect, useState } from 'react'
import { BellRing } from 'lucide-react'
import { Field, SelectInput } from '@/shared/components/Field'
import { useNotificationStore } from '../store/notificationStore'
import { ReminderTimePicker } from './ReminderTimePicker'

function getPermissionLabel() {
  if (!('Notification' in window)) return 'Not supported by this browser'
  if (Notification.permission === 'granted') return 'Allowed'
  if (Notification.permission === 'denied') return 'Blocked in browser settings'
  return 'Not requested'
}

export function ReminderSettingsCard() {
  const remindAtTime = useNotificationStore((state) => state.remindAtTime)
  const daysBefore = useNotificationStore((state) => state.daysBefore)
  const setRemindAtTime = useNotificationStore((state) => state.setRemindAtTime)
  const setDaysBefore = useNotificationStore((state) => state.setDaysBefore)
  const [permissionLabel, setPermissionLabel] = useState(getPermissionLabel)

  useEffect(() => {
    const updatePermission = () => setPermissionLabel(getPermissionLabel())
    window.addEventListener('focus', updatePermission)
    document.addEventListener('visibilitychange', updatePermission)
    return () => {
      window.removeEventListener('focus', updatePermission)
      document.removeEventListener('visibilitychange', updatePermission)
    }
  }, [])

  return (
    <section
      aria-labelledby="reminder-settings-heading"
      className="theme-card grid gap-4 rounded-lg border border-line p-5 sm:p-6"
    >
      <header className="grid gap-1">
        <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-ink">
          <BellRing aria-hidden="true" className="size-4" />
          Reminders
        </div>
        <h2 id="reminder-settings-heading" className="font-heading text-heading font-semibold text-ink">
          Due-date reminders
        </h2>
        <p className="text-small text-muted">
          Reminders are checked while the Kanbot app tab is open. Browser alerts also need permission.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <Field id="reminder-time" label="Remind at">
          <ReminderTimePicker value={remindAtTime} onChange={setRemindAtTime} />
        </Field>
        <Field id="reminder-day" label="Reminder day">
          <SelectInput
            id="reminder-day"
            value={daysBefore}
            onChange={(event) => setDaysBefore(event.target.value === '1' ? 1 : 0)}
          >
            <option value={0}>On the due day</option>
            <option value={1}>One day before</option>
          </SelectInput>
        </Field>
      </div>

      <p className="text-caption text-muted">
        Browser notification permission: <span className="font-medium text-ink">{permissionLabel}</span>
      </p>
    </section>
  )
}
