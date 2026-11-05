import { useRef, useState } from 'react'
import { LogOut, Moon, Sun, Upload, X } from 'lucide-react'
import { useAuth } from '@/app/hooks/useAuth'
import { useTheme } from '@/app/providers/theme'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { Skeleton } from '@/shared/components/Skeleton'
import { getErrorMessage } from '@/shared/api/errors'
import { Topbar } from '@/app/layouts/AppLayout/shared/topbar/Topbar'
import { ProfileAvatar } from '../components/ProfileAvatar'
import { LogoutConfirmationDialog } from '../components/LogoutConfirmationDialog'
import { useProfilePhoto } from '../hooks/useProfilePhoto'
import { useMe } from '@/features/auth/hooks/useMe'

export function ProfilePage() {
  const { user, isLoading } = useAuth()
  const meQuery = useMe()
  const { theme, toggleTheme } = useTheme()
  const { photo, error, savePhoto, removePhoto } = useProfilePhoto()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmLogout, setConfirmLogout] = useState(false)

  if (isLoading) {
    return (
      <>
        <Topbar title="Profile" />
        <main className="page-gutter mx-auto grid w-full max-w-backlog gap-6 py-6" role="status" aria-label="Loading profile">
          <div className="grid gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <section className="theme-card grid gap-5 p-5">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-48 max-w-full" />
              </div>
            </div>
          </section>
          <section className="theme-card grid gap-4 p-5">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-11 w-48" />
          </section>
        </main>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Topbar title="Profile" />
        <main className="page-gutter">
          <EmptyState
            title="Profile could not be loaded"
            description={getErrorMessage(meQuery.error ?? new Error('Your account is unavailable.'))}
            error
            action={<Button onClick={() => void meQuery.refetch()}>Try again</Button>}
          />
        </main>
      </>
    )
  }

  return (
    <>
    <Topbar title="Profile" />
    <div className="page-gutter mx-auto grid w-full max-w-backlog gap-6 py-6">
      <header className="grid gap-1">
        <h1 className="font-heading text-title font-semibold">Profile</h1>
        <p className="text-small text-muted">Manage your account photo and preferences.</p>
      </header>

 <section
  aria-labelledby="profile-account-heading"
  className="theme-card grid gap-5 p-5"
>
  <div className="grid gap-1">
    <h2
      id="profile-account-heading"
      className="font-heading text-heading font-semibold"
    >
      Account information
    </h2>
    <p className="text-small text-muted">
      Show your account details, change your profile photo.
    </p>
  </div>

  <div className="flex min-w-0 flex-wrap items-center gap-4">
    <div className="size-16 shrink-0 overflow-hidden rounded-full">
      <ProfileAvatar name={user.name} photo={photo} />
    </div>

    <div className="grid min-w-0 flex-1 gap-1">
      <p className="truncate text-body-strong">{user.name}</p>
      <p className="truncate text-small text-muted">{user.email}</p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        leadingIcon={<Upload aria-hidden="true" className="size-4" />}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload a profile photo"
      >
        Upload photo
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
        aria-label="Choose a profile photo"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) void savePhoto(file)
          event.currentTarget.value = ''
        }}
      />

      {photo && (
        <Button
          type="button"
          variant="ghost"
          leadingIcon={<X aria-hidden="true" className="size-4" />}
          onClick={removePhoto}
          aria-label="Remove profile photo"
        >
          Remove
        </Button>
      )}
    </div>
  </div>

  <p className="text-xs text-muted">
    PNG, JPG, SVG, or WebP up to 2 MB.
  </p>

  {error && (
    <p role="alert" className="text-small text-danger">
      {error}
    </p>
  )}
</section>

      <section aria-labelledby="profile-preferences-heading" className="theme-card grid gap-4 p-5">
        <div className="grid gap-1">
          <h2 id="profile-preferences-heading" className="font-heading text-heading font-semibold">Preferences</h2>
          <p className="text-small text-muted">Choose the appearance used across Kanbot.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label={`Use ${theme === 'dark' ? 'light' : 'dark'} theme`}
          onClick={toggleTheme}
          className="flex min-h-11 w-fit items-center gap-3 rounded-sm border border-line-strong bg-surface px-3 text-small text-ink hover:bg-sunken"
        >
          {theme === 'dark'
            ? <Moon aria-hidden="true" className="size-4" />
            : <Sun aria-hidden="true" className="size-4" />}
          <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          <span className="text-muted">· Click to switch</span>
        </button>
        
      </section>

      <section
        aria-labelledby="profile-logout-heading"
        className="theme-card flex flex-wrap items-center justify-between gap-4 p-5"
      >
        <div className="grid gap-1">
          <h2 id="profile-logout-heading" className="font-heading text-heading font-semibold">Log out</h2>
          <p className="text-small text-muted">Log out of your Kanbot account on this device.</p>
        </div>
        <Button
          type="button"
          variant="danger"
          leadingIcon={<LogOut aria-hidden="true" className="size-4" />}
          onClick={() => setConfirmLogout(true)}
          aria-label="Log out"
        >
          Log out
        </Button>
      </section>
      <LogoutConfirmationDialog open={confirmLogout} onOpenChange={setConfirmLogout} />

    </div>
    </>
  )
}
