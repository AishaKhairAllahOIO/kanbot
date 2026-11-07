import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ProfileStatusContext,
  type ProfileStatusClearAfter,
  type ProfileStatusContextValue,
  type ProfileStatusId,
  type ProfileStatusValue,
} from './ProfileStatusContext'

const STORAGE_PREFIX = 'kanbot:profile-status:'
const CLEAR_AFTER_MS: Record<Exclude<ProfileStatusClearAfter, 'today' | 'never'>, number> = {
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
}

function isStatusId(value: unknown): value is ProfileStatusId {
  return value === 'deep-work' ||
    value === 'planning-sprint' ||
    value === 'reviewing' ||
    value === 'blocked' ||
    value === 'on-break' ||
    value === 'done-today'
}

function isClearAfter(value: unknown): value is ProfileStatusClearAfter {
  return value === '30m' || value === '1h' || value === '4h' || value === 'today' || value === 'never'
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

function loadStatus(userId: string | null): { value: ProfileStatusValue | null; error: string | null } {
  if (!userId) return { value: null, error: null }
  try {
    const stored = window.localStorage.getItem(storageKey(userId))
    if (!stored) return { value: null, error: null }
    const parsed: unknown = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object') {
      return { value: null, error: 'Your saved status could not be read.' }
    }

    const data = parsed as Partial<ProfileStatusValue>
    if (
      !isStatusId(data.status) ||
      !isClearAfter(data.clearAfter) ||
      (data.expiresAt !== null && typeof data.expiresAt !== 'number')
    ) {
      return { value: null, error: 'Your saved status is invalid. Choose a new status to replace it.' }
    }
    if (data.expiresAt !== null && data.expiresAt <= Date.now()) {
      window.localStorage.removeItem(storageKey(userId))
      return { value: null, error: null }
    }
    return {
      value: {
        status: data.status,
        clearAfter: data.clearAfter,
        expiresAt: data.expiresAt ?? null,
      },
      error: null,
    }
  } catch {
    return { value: null, error: 'Your saved status could not be loaded from this browser.' }
  }
}

function getExpiry(clearAfter: ProfileStatusClearAfter) {
  if (clearAfter === 'never') return null
  if (clearAfter === 'today') {
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0)
    return tomorrow.getTime()
  }
  return Date.now() + CLEAR_AFTER_MS[clearAfter]
}

export function ProfileStatusProvider({
  userId,
  children,
}: {
  userId: string | null
  children: ReactNode
}) {
  const [stored, setStored] = useState(() => ({
    userId,
    ...loadStatus(userId),
  }))
  const value = stored.userId === userId ? stored.value : null
  const error = stored.userId === userId ? stored.error : null

  const setStatus = useCallback<ProfileStatusContextValue['setStatus']>((status, clearAfter) => {
    if (!userId) {
      setStored((current) => ({ ...current, error: 'Your account is not ready. Try again in a moment.' }))
      return
    }
    const next: ProfileStatusValue = { status, clearAfter, expiresAt: getExpiry(clearAfter) }
    try {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(next))
      setStored({ userId, value: next, error: null })
    } catch {
      setStored((current) => ({
        ...current,
        error: 'Your status could not be saved in this browser.',
      }))
    }
  }, [userId])

  const clearStatus = useCallback(() => {
    if (!userId) return
    try {
      window.localStorage.removeItem(storageKey(userId))
      setStored({ userId, value: null, error: null })
    } catch {
      setStored((current) => ({
        ...current,
        error: 'Your status could not be cleared from this browser.',
      }))
    }
  }, [userId])

  useEffect(() => {
    if (!value?.expiresAt) return
    const timeout = window.setTimeout(clearStatus, Math.max(0, value.expiresAt - Date.now()))
    return () => window.clearTimeout(timeout)
  }, [clearStatus, value])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey(userId ?? '')) return
      setStored({ userId, ...loadStatus(userId) })
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [userId])

  const contextValue = useMemo(
    () => ({ value, error, setStatus, clearStatus }),
    [clearStatus, error, setStatus, value],
  )

  return (
    <ProfileStatusContext.Provider value={contextValue}>
      {children}
    </ProfileStatusContext.Provider>
  )
}
