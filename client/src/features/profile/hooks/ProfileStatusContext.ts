import { createContext } from 'react'

export type ProfileStatusId =
  | 'deep-work'
  | 'planning-sprint'
  | 'reviewing'
  | 'blocked'
  | 'on-break'
  | 'done-today'

export type ProfileStatusClearAfter = '30m' | '1h' | '4h' | 'today' | 'never'

export interface ProfileStatusValue {
  status: ProfileStatusId
  clearAfter: ProfileStatusClearAfter
  expiresAt: number | null
}

export interface ProfileStatusContextValue {
  value: ProfileStatusValue | null
  error: string | null
  setStatus: (status: ProfileStatusId, clearAfter: ProfileStatusClearAfter) => void
  clearStatus: () => void
}

export const ProfileStatusContext = createContext<ProfileStatusContextValue | null>(null)
