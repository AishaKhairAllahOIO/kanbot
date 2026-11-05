import { useState } from 'react'

interface ProfileAvatarProps {
  name: string
  photo: string | null
  className?: string
}

export function ProfileAvatar({ name, photo, className = '' }: ProfileAvatarProps) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null)
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  if (photo && failedPhoto !== photo) {
    return (
      <img
        src={photo}
        alt={`${name}'s profile photo`}
        onError={() => setFailedPhoto(photo)}
        className={`size-full rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={`${name}'s profile avatar`}
      className={`grid size-full place-content-center rounded-full bg-sunken font-medium text-ink ${className}`}
    >
      {initial}
    </span>
  )
}
