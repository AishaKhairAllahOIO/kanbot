import type { CSSProperties } from 'react'
import { Outlet } from 'react-router'
import { useAuth } from '@/app/hooks/useAuth'
import { ProfilePhotoProvider } from '@/features/profile/hooks/ProfilePhotoProvider'
import { useLayoutStore } from './store/layoutStore'
import { TopbarHost } from './shared/topbar/components/TopbarHost'
import { AppOverlays } from './overlays/AppOverlays'
import { Sidebar } from './desktop/sidebar/Sidebar'
import { TabletSidebar } from './desktop/sidebar/TabletSidebar'
import { BottomNav } from './mobile/BottomNav'
import { FocusTimer } from './FocusTimer'
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
  )
}
