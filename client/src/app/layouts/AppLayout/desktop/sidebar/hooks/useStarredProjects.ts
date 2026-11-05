import { useCallback, useMemo, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'kanbot:starred-projects'
const listeners = new Set<() => void>()

function load(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '[]'
  } catch {
    return '[]'
  }
}

let raw = load()

function parse(value: string): string[] {
  try {
    const data: unknown = JSON.parse(value)
    return Array.isArray(data) ? data.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      raw = load()
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  listeners.add(listener)
  return () => {
    window.removeEventListener('storage', onStorage)
    listeners.delete(listener)
  }
}

function write(ids: string[]) {
  raw = JSON.stringify(ids)
  try {
    localStorage.setItem(STORAGE_KEY, raw)
  } catch {
    // Storage unavailable: keep the value in memory for this session.
  }
  listeners.forEach((listener) => listener())
}

export function useStarredProjects() {
  const snapshot = useSyncExternalStore(subscribe, () => raw, () => '[]')
  const starredIds = useMemo(() => parse(snapshot), [snapshot])

  const isStarred = useCallback((projectId: string) => starredIds.includes(projectId), [starredIds])
  const toggleStar = useCallback((projectId: string) => {
    const current = parse(raw)
    write(current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId])
  }, [])

  return { starredIds, isStarred, toggleStar }
}
