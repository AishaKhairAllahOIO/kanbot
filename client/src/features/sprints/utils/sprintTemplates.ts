import { addDays, format } from 'date-fns'

export interface SprintTemplate {
  defaultLengthDays: number
  defaultCapacity: number
  namePrefix: string
}

export const DEFAULT_SPRINT_TEMPLATE: SprintTemplate = {
  defaultLengthDays: 14,
  defaultCapacity: 30,
  namePrefix: 'Sprint',
}

function getStorageKey(projectId: string): string {
  return `kanbot_sprint_template_${projectId}`
}

export function getSprintTemplate(projectId: string): SprintTemplate {
  if (!projectId || typeof window === 'undefined') return DEFAULT_SPRINT_TEMPLATE
  try {
    const raw = localStorage.getItem(getStorageKey(projectId))
    if (!raw) return DEFAULT_SPRINT_TEMPLATE
    const parsed = JSON.parse(raw)
    return {
      defaultLengthDays: Number(parsed.defaultLengthDays) || DEFAULT_SPRINT_TEMPLATE.defaultLengthDays,
      defaultCapacity: Number(parsed.defaultCapacity) || DEFAULT_SPRINT_TEMPLATE.defaultCapacity,
      namePrefix: parsed.namePrefix ? String(parsed.namePrefix) : DEFAULT_SPRINT_TEMPLATE.namePrefix,
    }
  } catch {
    return DEFAULT_SPRINT_TEMPLATE
  }
}

export function saveSprintTemplate(projectId: string, template: SprintTemplate): void {
  if (!projectId || typeof window === 'undefined') return
  localStorage.setItem(getStorageKey(projectId), JSON.stringify(template))
  window.dispatchEvent(new CustomEvent('kanbot:sprint-template-changed', { detail: { projectId } }))
}

export function calculateSprintDatesFromTemplate(projectId: string): { startDate: string; endDate: string } {
  const template = getSprintTemplate(projectId)
  const start = new Date()
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(addDays(start, template.defaultLengthDays), 'yyyy-MM-dd'),
  }
}
