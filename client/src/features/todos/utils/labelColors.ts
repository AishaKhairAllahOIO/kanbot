export interface LabelColorOption {
  id: string
  name: string
  bg: string
  text: string
  border: string
}

export const LABEL_PALETTE: LabelColorOption[] = [
  { id: 'blue', name: 'Blue', bg: 'color-mix(in srgb, var(--label-blue) 14%, var(--surface))', text: 'var(--label-blue)', border: 'color-mix(in srgb, var(--label-blue) 38%, var(--surface))' },
  { id: 'indigo', name: 'Indigo', bg: 'color-mix(in srgb, var(--label-indigo) 14%, var(--surface))', text: 'var(--label-indigo)', border: 'color-mix(in srgb, var(--label-indigo) 38%, var(--surface))' },
  { id: 'purple', name: 'Purple', bg: 'color-mix(in srgb, var(--label-purple) 14%, var(--surface))', text: 'var(--label-purple)', border: 'color-mix(in srgb, var(--label-purple) 38%, var(--surface))' },
  { id: 'pink', name: 'Pink', bg: 'color-mix(in srgb, var(--label-pink) 14%, var(--surface))', text: 'var(--label-pink)', border: 'color-mix(in srgb, var(--label-pink) 38%, var(--surface))' },
  { id: 'rose', name: 'Rose', bg: 'color-mix(in srgb, var(--label-rose) 14%, var(--surface))', text: 'var(--label-rose)', border: 'color-mix(in srgb, var(--label-rose) 38%, var(--surface))' },
  { id: 'orange', name: 'Orange', bg: 'color-mix(in srgb, var(--label-orange) 14%, var(--surface))', text: 'var(--label-orange)', border: 'color-mix(in srgb, var(--label-orange) 38%, var(--surface))' },
  { id: 'amber', name: 'Amber', bg: 'color-mix(in srgb, var(--label-amber) 14%, var(--surface))', text: 'var(--label-amber)', border: 'color-mix(in srgb, var(--label-amber) 38%, var(--surface))' },
  { id: 'emerald', name: 'Emerald', bg: 'color-mix(in srgb, var(--label-emerald) 14%, var(--surface))', text: 'var(--label-emerald)', border: 'color-mix(in srgb, var(--label-emerald) 38%, var(--surface))' },
  { id: 'teal', name: 'Teal', bg: 'color-mix(in srgb, var(--label-teal) 14%, var(--surface))', text: 'var(--label-teal)', border: 'color-mix(in srgb, var(--label-teal) 38%, var(--surface))' },
  { id: 'cyan', name: 'Cyan', bg: 'color-mix(in srgb, var(--label-cyan) 14%, var(--surface))', text: 'var(--label-cyan)', border: 'color-mix(in srgb, var(--label-cyan) 38%, var(--surface))' },
]

function getStorageKey(projectId: string): string {
  return `kanbot_label_colors_${projectId}`
}

export function getDefaultLabelColor(label: string): LabelColorOption {
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % LABEL_PALETTE.length
  return LABEL_PALETTE[index]
}

export function getStoredLabelColors(projectId: string): Record<string, string> {
  if (!projectId || typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(getStorageKey(projectId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveStoredLabelColor(projectId: string, label: string, colorId: string): void {
  if (!projectId || typeof window === 'undefined') return
  try {
    const current = getStoredLabelColors(projectId)
    current[label] = colorId
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(current))
    window.dispatchEvent(new CustomEvent('kanbot:label-colors-changed', { detail: { projectId } }))
  } catch {
    // ignore
  }
}

export function removeStoredLabelColor(projectId: string, label: string): void {
  if (!projectId || typeof window === 'undefined') return
  try {
    const current = getStoredLabelColors(projectId)
    delete current[label]
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(current))
    window.dispatchEvent(new CustomEvent('kanbot:label-colors-changed', { detail: { projectId } }))
  } catch {
    // ignore
  }
}

export function getEffectiveLabelColor(projectId: string, label: string): LabelColorOption {
  const custom = getStoredLabelColors(projectId)
  const colorId = custom[label]
  if (colorId) {
    const matched = LABEL_PALETTE.find((opt) => opt.id === colorId)
    if (matched) return matched
  }
  return getDefaultLabelColor(label)
}
