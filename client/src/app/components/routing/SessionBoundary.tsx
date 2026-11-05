import type { ReactNode } from 'react'
import { getErrorMessage } from '@/shared/api/errors'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { Logo } from '@/shared/components/Logo'
import { Skeleton } from '@/shared/components/Skeleton'
import { useAuthStore } from '@/shared/store/auth.store'
import { useMe } from '@/features/auth/hooks/useMe'

export function SessionBoundary({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token)
  const { isPending, isError, error, refetch } = useMe()

  if (token && isPending) {
    return (
      <div className="grid min-h-dvh place-content-center justify-items-center gap-4" role="status" aria-label="Checking your session">
        <Logo size={48} />
        <Skeleton className="h-4 w-40" />
      </div>
    )
  }

  if (token && isError && error) {
    return (
      <div className="grid min-h-dvh place-content-center justify-items-center gap-4 px-4 text-center">
        <Logo size={48} />
        <EmptyState
          title="Your session could not be checked"
          description={getErrorMessage(error)}
          error
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      </div>
    )
  }

  return children
}
