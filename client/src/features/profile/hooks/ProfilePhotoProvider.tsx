import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ProfilePhotoContext } from './ProfilePhotoContext'

const MAX_PHOTO_SIZE = 2 * 1024 * 1024
const PHOTO_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  webp: 'image/webp',
}

interface StoredPhotoState {
  userId: string | null
  photo: string | null
  error: string | null
}

function photoStorageKey(userId: string) {
  return `kanbot:profile-photo:${userId}`
}

function validatePhoto(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || PHOTO_TYPES[extension] !== file.type) {
    return 'Choose a PNG, JPG, JPEG, SVG, or WebP image.'
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return 'The image must be 2 MB or smaller.'
  }
  return null
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('The image could not be read.'))
    }
    reader.onerror = () => reject(new Error('The image could not be read.'))
    reader.readAsDataURL(file)
  })
}

export function ProfilePhotoProvider({
  userId,
  children,
}: {
  userId: string | null
  children: ReactNode
}) {
  const [stored, setStored] = useState<StoredPhotoState>(() => {
    if (!userId) return { userId: null, photo: null, error: null }
    try {
      return {
        userId,
        photo: window.localStorage.getItem(photoStorageKey(userId)),
        error: null,
      }
    } catch {
      return {
        userId,
        photo: null,
        error: 'Your saved profile photo could not be loaded from this browser.',
      }
    }
  })
  const photo = stored.userId === userId ? stored.photo : null
  const error = stored.userId === userId ? stored.error : null

  const savePhoto = useCallback(async (file: File) => {
    const validationError = validatePhoto(file)
    if (validationError) {
      setStored((current) => ({ ...current, error: validationError }))
      return
    }
    if (!userId) {
      setStored((current) => ({ ...current, error: 'Your account is not ready. Try again in a moment.' }))
      return
    }

    let dataUrl: string
    try {
      dataUrl = await readAsDataUrl(file)
    } catch {
      setStored((current) => ({ ...current, error: 'The selected image could not be read. Choose another image and try again.' }))
      return
    }

    try {
      window.localStorage.setItem(photoStorageKey(userId), dataUrl)
      setStored({ userId, photo: dataUrl, error: null })
    } catch {
      setStored((current) => ({
        ...current,
        error: 'The profile photo could not be saved in this browser. Check available storage and try again.',
      }))
    }
  }, [userId])

  const removePhoto = useCallback(() => {
    if (!userId) {
      setStored((current) => ({ ...current, error: 'Your account is not ready. Try again in a moment.' }))
      return
    }

    try {
      window.localStorage.removeItem(photoStorageKey(userId))
      setStored({ userId, photo: null, error: null })
    } catch {
      setStored((current) => ({
        ...current,
        error: 'The saved profile photo could not be removed from this browser.',
      }))
    }
  }, [userId])

  const value = useMemo(
    () => ({ photo, error, savePhoto, removePhoto }),
    [photo, error, savePhoto, removePhoto],
  )

  return <ProfilePhotoContext.Provider value={value}>{children}</ProfilePhotoContext.Provider>
}
