import type { Todo } from '../../../shared/types/api'

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '""'
  const stringValue = String(value).replace(/"/g, '""')
  return `"${stringValue}"`
}

export function exportTodosToCsv(todos: Todo[], filename = 'backlog-export.csv'): void {
  const headers = [
    'Key',
    'Title',
    'Type',
    'Status',
    'Priority',
    'Story Points',
    'Due Date',
    'Labels',
    'Sprint ID',
    'Completed At',
  ]

  const rows = todos.map((todo) => [
    escapeCsvField(todo.key),
    escapeCsvField(todo.title),
    escapeCsvField(todo.type),
    escapeCsvField(todo.status),
    escapeCsvField(todo.priority),
    escapeCsvField(todo.storyPoints ?? ''),
    escapeCsvField(todo.dueDate ?? ''),
    escapeCsvField(todo.labels.join(', ')),
    escapeCsvField(todo.sprintId ?? 'Backlog'),
    escapeCsvField(todo.completedAt ?? ''),
  ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n')
  triggerDownload(`\uFEFF${csvContent}`, filename, 'text/csv')
}

export function exportTodosToMarkdown(
  todos: Todo[],
  title = 'Backlog Export',
  filename = 'backlog-export.md',
): void {
  const totalPoints = todos.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0)

  const lines: string[] = [
    `# ${title}`,
    '',
    `*Generated on ${new Date().toLocaleDateString()} · Total Todos: ${todos.length} · Total Points: ${totalPoints}*`,
    '',
    '| Key | Title | Type | Status | Priority | Points | Due Date | Labels |',
    '| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |',
  ]

  todos.forEach((todo) => {
    const safeTitle = todo.title.replace(/\|/g, '\\|')
    const labels = todo.labels.length ? todo.labels.join(', ') : '–'
    const points = todo.storyPoints !== null ? String(todo.storyPoints) : '–'
    const dueDate = todo.dueDate || '–'
    lines.push(
      `| **${todo.key}** | ${safeTitle} | ${todo.type} | ${todo.status} | ${todo.priority} | ${points} | ${dueDate} | ${labels} |`,
    )
  })

  lines.push('')
  triggerDownload(lines.join('\n'), filename, 'text/markdown')
}

