import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useToast } from '@/app/providers/toast'
import { useNotificationStore } from '../store/notificationStore'

interface ProjectReminderToggleProps {
  projectId: string
  projectName?: string
  compact?: boolean
}

export function ProjectReminderToggle({
  projectId,
  projectName = 'this project',
  compact = false,
}: ProjectReminderToggleProps) {
  const showToast = useToast()
  const enabled = useNotificationStore((state) =>
    state.enabledProjectIds.includes(projectId),
  )
  const toggleProject = useNotificationStore((state) => state.toggleProject)
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleToggle() {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      if (enabled) {
        toggleProject(projectId)
        showToast(`Due-date reminders disabled for ${projectName}.`, 'info')
        return
      }

      let permission: NotificationPermission | 'unsupported' = 'unsupported'
      if ('Notification' in window) {
        permission = Notification.permission
        if (permission === 'default') {
          try {
            permission = await Notification.requestPermission()
          } catch {
            permission = Notification.permission
          }
        }
      }

      toggleProject(projectId)
      if (permission === 'granted') {
        showToast(`Due-date reminders enabled for ${projectName}.`, 'success')
      } else {
        showToast(
          `In-app reminders enabled for ${projectName}. Browser notifications are unavailable; check this site's notification permission.`,
          'info',
        )
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <button
      type="button"
      aria-label={`${enabled ? 'Disable' : 'Enable'} due-date reminders for ${projectName}`}
      aria-pressed={enabled}
      disabled={isProcessing}
      title={`${enabled ? 'Disable' : 'Enable'} due-date reminders for ${projectName}`}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void handleToggle()
      }}
      className={`grid ${compact ? 'size-7' : 'size-8'} shrink-0 place-content-center rounded-sm transition-colors disabled:cursor-wait disabled:opacity-60 ${enabled ? 'text-brand-ink hover:bg-brand-soft' : 'text-muted hover:bg-sunken hover:text-brand-ink'}`}
    >
      {enabled ? (
        <Bell aria-hidden="true" className={compact ? 'size-3.5' : 'size-4'} />
      ) : (
        <BellOff aria-hidden="true" className={compact ? 'size-3.5' : 'size-4'} />
      )}
    </button>
  )
}
