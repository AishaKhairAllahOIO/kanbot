import type { Todo } from '@/shared/types/api'

export function PointsPill({ todo }: { todo: Todo }) {
  return (
    <span
      className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--label-indigo)_14%,transparent)] px-2 py-0.5 text-caption font-medium tabular-nums text-[var(--label-indigo)]"
      title={todo.storyPoints === null ? 'Not estimated' : `${todo.storyPoints} story points`}
    >
      {todo.storyPoints === null ? '–' : `${todo.storyPoints} pts`}
    </span>
  )
}