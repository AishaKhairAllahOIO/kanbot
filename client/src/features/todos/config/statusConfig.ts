import type { TodoStatus } from '@/shared/types/api'

export const statusNames: Record<TodoStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

export const statusDot: Record<TodoStatus, string> = {
  todo: 'bg-status-todo',
  in_progress: 'bg-status-in-progress',
  in_review: 'bg-status-in-review',
  done: 'bg-status-done',
}

export const statusText: Record<TodoStatus, string> = {
  todo: 'text-status-todo',
  in_progress: 'text-status-in-progress',
  in_review: 'text-status-in-review',
  done: 'text-status-done',
}

export const statusHoverText: Record<TodoStatus, string> = {
  todo: 'group-hover:text-status-todo',
  in_progress: 'group-hover:text-status-in-progress',
  in_review: 'group-hover:text-status-in-review',
  done: 'group-hover:text-status-done',
}

export const statusBadge: Record<TodoStatus, string> = {
  todo: 'border-status-todo/30 bg-status-todo/10 text-status-todo',
  in_progress: 'border-status-in-progress/30 bg-status-in-progress/10 text-status-in-progress',
  in_review: 'border-status-in-review/30 bg-status-in-review/10 text-status-in-review',
  done: 'border-status-done/30 bg-status-done/10 text-status-done',
}

export const statusColor: Record<TodoStatus, string> = {
  todo: 'border-t-status-todo',
  in_progress: 'border-t-status-in-progress',
  in_review: 'border-t-status-in-review',
  done: 'border-t-status-done',
}
