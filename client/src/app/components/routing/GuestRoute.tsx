import { Navigate, Outlet, useLocation } from 'react-router'
import { getSafeRedirect } from '@/app/navigation'
import { useAuth } from '@/app/hooks/useAuth'

export function GuestRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (isAuthenticated) return <Navigate to={getSafeRedirect(location.search)} replace />

  return <Outlet />
}
