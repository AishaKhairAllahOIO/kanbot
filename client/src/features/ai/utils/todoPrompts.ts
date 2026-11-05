import type { Todo } from '../../../shared/types/api'

export function buildTodoImprovementPrompt(todo: Pick<Todo, 'key' | 'title' | 'description'>) {
  const description = todo.description.slice(0, 3000)
  return [
    `Improve this todo (${todo.key}).`,
    `Current title: ${todo.title}`,
    `Current description: ${description || '(none)'}${description.length < todo.description.length ? '\n[Description truncated]' : ''}`,
    'Suggest a clearer, more specific title, an organized and detailed description, and testable acceptance criteria in Markdown.',
    'Do not change any data; return the proposed content for review.',
  ].join('\n')
}

export function buildTodoEstimatePrompt(todo: Pick<Todo, 'key' | 'title' | 'description' | 'type'>) {
  const description = todo.description.slice(0, 3000)
  return [
    `Estimate this unestimated todo (${todo.key}).`,
    `Type: ${todo.type}`,
    `Title: ${todo.title}`,
    `Description: ${description || '(none)'}${description.length < todo.description.length ? '\n[Description truncated]' : ''}`,
    'Suggest one story point value from the Fibonacci sequence 1, 2, 3, 5, 8, 13 and explain the effort and uncertainty behind the estimate.',
    'Do not change any data; return the estimate for review.',
  ].join('\n')
}
