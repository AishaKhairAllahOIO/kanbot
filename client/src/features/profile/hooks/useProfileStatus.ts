import { useContext } from 'react'
import { ProfileStatusContext } from './ProfileStatusContext'

export function useProfileStatus() {
  const context = useContext(ProfileStatusContext)
  if (!context) throw new Error('useProfileStatus must be used within ProfileStatusProvider')
  return context
}
