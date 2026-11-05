import type { Todo, TodoStatus } from '../../../shared/types/api'

const statusClass: Record<TodoStatus, string> = {
  todo: 'bg-line-strong',
  in_progress: 'bg-status-in-progress',
  in_review: 'bg-status-in-review',
  done: 'bg-signal',
}

const statusOrder: TodoStatus[] = ['todo', 'in_progress', 'in_review', 'done']

export function SprintRibbon({ todos, compact = false }: { todos: Todo[]; compact?: boolean }) {
  const ordered = [...todos].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return -1
    if (b.status === 'done' && a.status !== 'done') return 1
    return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) || a.order - b.order
  })
  const totalPoints = ordered.reduce((total, todo) => total + (todo.storyPoints ?? 1), 0)
  const donePoints = ordered
    .filter((todo) => todo.status === 'done')
    .reduce((total, todo) => total + (todo.storyPoints ?? 1), 0)

  return (
    <div>
      <div className={`flex w-full gap-0.5 ${compact ? 'h-1.5' : 'h-2.5'}`} aria-hidden="true">
        {ordered.length === 0 ? (
          <span className="w-full rounded-full bg-sunken" />
        ) : (
          ordered.map((todo) => (
            <span
              key={todo.id}
              title={`${todo.key} · ${todo.title} · ${todo.storyPoints ?? 1} pts`}
              className={`min-w-1.5 rounded-sm ${statusClass[todo.status]}`}
              style={{ flexGrow: todo.storyPoints ?? 1 }}
            />
          ))
        )}
      </div>
      <span
        role="progressbar"
        aria-valuenow={donePoints}
        aria-valuemax={totalPoints}
        aria-valuetext={`${donePoints} of ${totalPoints} points done`}
        className="sr-only"
      >
        {donePoints} of {totalPoints} points done
      </span>
    </div>
  )
}
