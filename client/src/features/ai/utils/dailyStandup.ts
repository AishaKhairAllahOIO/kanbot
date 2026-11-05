import type { Todo } from '../../../shared/types/api'

function describe(todo: Todo) {
  const due = todo.dueDate ? ` (due ${todo.dueDate})` : ''
  const title = todo.title.length > 140 ? `${todo.title.slice(0, 137)}...` : todo.title
  return `- ${todo.key}: ${title}${due}`
}

export function buildDailyStandupPrompt(
  todos: Todo[],
  activeSprintId: string | null,
  now = new Date(),
) {
  const recentCutoff = now.getTime() - 48 * 60 * 60 * 1000
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const recentCompleted = todos.filter((todo) => {
    if (todo.status !== 'done' || !todo.completedAt) return false
    const completedAt = Date.parse(todo.completedAt)
    return Number.isFinite(completedAt) && completedAt >= recentCutoff && completedAt <= now.getTime()
  })
  const activeWork = todos.filter(
    (todo) => activeSprintId !== null && todo.sprintId === activeSprintId && todo.status !== 'done',
  )
  const overdue = todos.filter((todo) => {
    if (todo.status === 'done' || !todo.dueDate) return false
    const dueDate = Date.parse(`${todo.dueDate}T00:00:00`)
    return Number.isFinite(dueDate) && dueDate < today
  })
  const urgent = activeWork.filter((todo) => todo.priority === 'urgent')

  const listSection = (title: string, items: Todo[]) =>
    `${title}\n${items.length ? items.slice(0, 4).map(describe).join('\n') : '- None identified'}`

  return [
    'Prepare a concise, professional daily stand-up update from the project data below.',
    'Answer these three questions: 1) What did I do yesterday/recently? 2) What am I working on next? 3) Are there any blockers or overdue risks?',
    'Do not invent progress or blockers. Treat overdue tasks and urgent active tasks as potential risks, not confirmed blockers.',
    listSection('Completed in the last 48 hours', recentCompleted),
    listSection('Current active sprint work', activeWork),
    listSection('Overdue tasks', overdue),
    listSection('Urgent active sprint tasks', urgent),
  ].join('\n\n')
}
