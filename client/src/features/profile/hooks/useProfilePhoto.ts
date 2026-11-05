import { useContext } from 'react'
import { ProfilePhotoContext } from './ProfilePhotoContext'

export function useProfilePhoto() {
  const context = useContext(ProfilePhotoContext)
  if (!context) throw new Error('useProfilePhoto must be used within ProfilePhotoProvider')
  return context
}
