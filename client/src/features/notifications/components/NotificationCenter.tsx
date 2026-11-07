import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '@/shared/config/paths'
import { useNotificationStore } from '../store/notificationStore'

function formatDueDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const notifications = useNotificationStore((state) => state.notifications)
  const markRead = useNotificationStore((state) => state.markNotificationRead)
  const markAllRead = useNotificationStore((state) => state.markAllNotificationsRead)
  const clearNotifications = useNotificationStore((state) => state.clearNotifications)
  const unreadCount = notifications.filter((item) => !item.isRead).length
  const countLabel = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          aria-haspopup="dialog"
          aria-expanded={open}
          title="Notifications"
          className="topbar-action relative grid size-9 shrink-0 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-brand-ink"
        >
          <Bell aria-hidden="true" className="size-4" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -end-0.5 -top-0.5 grid min-h-4 min-w-4 place-content-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white"
            >
              {countLabel}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          aria-label="Notifications"
          className="z-popover w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-line bg-raised shadow-pop outline-none"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <Popover.Title className="text-small font-semibold text-ink">
                Notifications
              </Popover.Title>
              <Popover.Description className="text-caption text-muted">
                {unreadCount ? `${unreadCount} unread` : 'Due-date reminders'}
              </Popover.Description>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={unreadCount === 0}
                onClick={markAllRead}
                className="grid size-8 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Mark all notifications as read"
                title="Mark all as read"
              >
                <CheckCheck aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                disabled={notifications.length === 0}
                onClick={clearNotifications}
                className="grid size-8 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Clear all notifications"
                title="Clear all"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          </header>
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-small text-muted">
              No reminders yet. Enabled project reminders will appear here.
            </p>
          ) : (
            <ul className="max-h-[min(28rem,65vh)] divide-y divide-line overflow-y-auto">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-start gap-2 px-4 py-3 ${item.isRead ? '' : 'bg-brand-soft/40'}`}
                >
                  <Link
                    to={paths.board(item.projectId)}
                    onClick={() => {
                      markRead(item.id)
                      setOpen(false)
                    }}
                    className="min-w-0 flex-1 rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <span className="flex items-center gap-2">
                      {!item.isRead && (
                        <span aria-label="Unread" className="size-1.5 shrink-0 rounded-full bg-brand" />
                      )}
                      <span className="truncate text-small font-semibold text-ink">
                        {item.projectName}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-small text-muted">
                      <span className="font-medium text-ink">{item.todoKey}</span>
                      {' · '}{item.todoTitle}
                    </span>
                    <span className="mt-1 block text-caption text-muted">
                      {item.kind === 'overdue' ? 'Overdue' : 'Due'} · {formatDueDate(item.dueDate)}
                    </span>
                  </Link>
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => markRead(item.id)}
                      className="grid size-8 shrink-0 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-brand-ink"
                      aria-label={`Mark ${item.projectName}: ${item.todoKey} as read`}
                      title="Mark as read"
                    >
                      <Check aria-hidden="true" className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
