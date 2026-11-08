import type { CSSProperties } from 'react'
import { Outlet } from 'react-router'
import { useAuth } from '@/app/hooks/useAuth'
import { ProfilePhotoProvider } from '@/features/profile/hooks/ProfilePhotoProvider'
import { useLayoutStore } from './shared/store/layoutStore'
import { TopbarHost } from './topbar/components/TopbarHost'
import { AppOverlays } from './overlays/AppOverlays'
import { Sidebar, TabletSidebar } from './sidebar/Sidebar'
import { BottomNav } from './bottom-nav/BottomNav'
import { FocusTimer } from './focus/FocusTimer'
import { FocusTimerProvider } from './focus/state/FocusTimerProvider'
import { ProfileStatusProvider } from '@/features/profile/hooks/ProfileStatusProvider'
import { useDueReminders } from '@/features/notifications/hooks/useDueReminders'

export function AppLayout() {
  useDueReminders()
  const { user } = useAuth()
  const isSidebarCollapsed = useLayoutStore((state) => state.isSidebarCollapsed)
  const layoutStyle = {
    '--sidebar-current': isSidebarCollapsed ? '0px' : 'var(--sidebar-width)',
  } as CSSProperties

  return (
    <FocusTimerProvider key={user?.id ?? 'anonymous'} userId={user?.id ?? null}>
      <ProfilePhotoProvider key={user?.id ?? 'anonymous'} userId={user?.id ?? null}>
        <ProfileStatusProvider key={user?.id ?? 'anonymous'} userId={user?.id ?? null}>
          <div style={layoutStyle} className="flex h-dvh min-h-0 flex-col overflow-hidden">
            <TopbarHost />
            <div className="relative flex min-h-0 min-w-0 flex-1">
              <Sidebar collapsed={isSidebarCollapsed} />
              <TabletSidebar />
              <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0">
                <Outlet />
              </main>
            </div>
            <BottomNav />
            <AppOverlays />
            <FocusTimer />
          </div>
        </ProfileStatusProvider>
      </ProfilePhotoProvider>
    </FocusTimerProvider>
  )
}
