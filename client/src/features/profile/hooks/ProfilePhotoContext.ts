import { createContext } from 'react'

export interface ProfilePhotoContextValue {
  photo: string | null
  error: string | null
  savePhoto: (file: File) => Promise<void>
  removePhoto: () => void
}

export const ProfilePhotoContext = createContext<ProfilePhotoContextValue | null>(null)
