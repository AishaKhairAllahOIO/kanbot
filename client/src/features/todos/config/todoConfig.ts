import {
  Bookmark,
  Bug,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  Equal,
  SquareCheck,
} from 'lucide-react'
import type { TodoPriority, TodoType } from '@/shared/types/api'

export const typeConfig: Record<
  TodoType,
  { label: string; icon: typeof SquareCheck; color: string; className: string }
> = {
  task: {
    label: 'Task',
    icon: SquareCheck,
    color: 'var(--type-task)',
    className: 'text-type-task',
  },
  story: {
    label: 'Story',
    icon: Bookmark,
    color: 'var(--type-story)',
    className: 'text-type-story',
  },
  bug: {
    label: 'Bug',
    icon: Bug,
    color: 'var(--type-bug)',
    className: 'text-type-bug',
  },
}

export const priorityConfig: Record<
  TodoPriority,
  { label: string; icon: typeof ChevronDown; color: string; className: string }
> = {
  low: {
    label: 'Low',
    icon: ChevronDown,
    color: 'var(--priority-low)',
    className: 'text-priority-low',
  },
  medium: {
    label: 'Medium',
    icon: Equal,
    color: 'var(--priority-medium)',
    className: 'text-priority-medium',
  },
  high: {
    label: 'High',
    icon: ChevronUp,
    color: 'var(--priority-high)',
    className: 'text-priority-high',
  },
  urgent: {
    label: 'Urgent',
    icon: ChevronsUp,
    color: 'var(--priority-urgent)',
    className: 'text-priority-urgent',
  },
}
