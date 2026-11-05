import type { Sprint, Todo } from '../../../shared/types/api'

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

export function exportSprintSummaryToMarkdown(
  sprint: Sprint,
  todos?: Todo[],
  filename = `${sprint.name.toLowerCase().replace(/\s+/g, '-')}-summary.md`,
): void {
  const stats = sprint.completedStats ?? sprint.stats
  const completionRate = stats.totalTodos
    ? Math.round((stats.doneTodos / stats.totalTodos) * 100)
    : 0

  const lines: string[] = [
    `# ${sprint.name} Summary`,
    '',
    `- **Status**: ${sprint.status}`,
    `- **Dates**: ${sprint.startDate || '–'} to ${sprint.endDate || '–'}`,
    `- **Goal**: ${sprint.goal || 'No goal set'}`,
    '',
    '## Key Metrics',
    '',
    `- **Completed Todos**: ${stats.doneTodos} / ${stats.totalTodos} (${completionRate}%)`,
    `- **Points Delivered**: ${stats.donePoints} / ${stats.totalPoints} pts`,
  ]

  if (sprint.completedStats?.carriedOver !== undefined) {
    lines.push(`- **Carried Over**: ${sprint.completedStats.carriedOver} todos`)
  }

  if (sprint.summary?.content) {
    lines.push('', '## AI Summary', '', sprint.summary.content)
  }

  if (todos && todos.length > 0) {
    lines.push(
      '',
      '## Sprint Todos',
      '',
      '| Key | Title | Status | Priority | Points | Due Date |',
      '| :--- | :--- | :--- | :--- | :---: | :--- |',
    )
    todos.forEach((todo) => {
      const safeTitle = todo.title.replace(/\|/g, '\\|')
      const points = todo.storyPoints !== null ? String(todo.storyPoints) : '–'
      lines.push(`| **${todo.key}** | ${safeTitle} | ${todo.status} | ${todo.priority} | ${points} | ${todo.dueDate || '–'} |`)
    })
  }

  lines.push('')
  triggerDownload(lines.join('\n'), filename, 'text/markdown')
}

export function exportSprintSummaryToCsv(
  sprint: Sprint,
  todos?: Todo[],
  filename = `${sprint.name.toLowerCase().replace(/\s+/g, '-')}-summary.csv`,
): void {
  const stats = sprint.completedStats ?? sprint.stats

  const headers = ['Sprint Name', 'Status', 'Start Date', 'End Date', 'Goal', 'Done Todos', 'Total Todos', 'Done Points', 'Total Points']
  const values = [
    escapeCsvField(sprint.name),
    escapeCsvField(sprint.status),
    escapeCsvField(sprint.startDate ?? ''),
    escapeCsvField(sprint.endDate ?? ''),
    escapeCsvField(sprint.goal ?? ''),
    escapeCsvField(stats.doneTodos),
    escapeCsvField(stats.totalTodos),
    escapeCsvField(stats.donePoints),
    escapeCsvField(stats.totalPoints),
  ]

  let csvContent = [headers.join(','), values.join(',')].join('\r\n')

  if (todos && todos.length > 0) {
    const todoHeaders = ['\r\n\r\nKey', 'Title', 'Type', 'Status', 'Priority', 'Points', 'Due Date']
    const todoRows = todos.map((t) => [
      escapeCsvField(t.key),
      escapeCsvField(t.title),
      escapeCsvField(t.type),
      escapeCsvField(t.status),
      escapeCsvField(t.priority),
      escapeCsvField(t.storyPoints ?? ''),
      escapeCsvField(t.dueDate ?? ''),
    ])
    csvContent += todoHeaders.join(',') + '\r\n' + todoRows.map((r) => r.join(',')).join('\r\n')
  }

  triggerDownload(`\uFEFF${csvContent}`, filename, 'text/csv')
}

