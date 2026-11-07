import { useState } from 'react'
import { Lock, LogOut } from 'lucide-react'
import { NavLink } from 'react-router'
import { LogoutConfirmationDialog } from '@/features/auth/components/LogoutConfirmationDialog'
import { DailyFocusButton } from './components/DailyFocusButton'
import { PROJECTS_NAV_ITEM, useProjectNavItems } from '../../shared/hooks/useProjectNavItems'
import { StarredProjectsMenu } from './components/StarredProjectsMenu'
import { useParams } from 'react-router'
import { prefetchRoute } from '../../../../providers/router/routeModules'

const iconLinkClass =
  'grid size-10 place-content-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-ink'

export function TabletSidebar() {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const { projectId } = useParams()
  const items = [PROJECTS_NAV_ITEM, ...useProjectNavItems(projectId)]

  return (
    <>
    <aside className="hidden h-full w-16 shrink-0 flex-col items-center gap-2 border-e border-line bg-surface py-3 md:flex xl:hidden">
      <nav aria-label="Tablet navigation" className="flex flex-col items-center gap-2">
        {items.map((item) => {
          const Icon = item.icon
          if (!item.enabled) {
            return (
              <button
                key={item.label}
                type="button"
                disabled
                aria-label={item.label}
                title={item.label}
                className={`${iconLinkClass} cursor-not-allowed opacity-50`}
              >
                <span className="relative">
                  <Icon aria-hidden="true" className="size-5" />
                  <Lock aria-hidden="true" className="absolute -end-2 -top-1 size-3" />
                </span>
              </button>
            )
          }

          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              onPointerEnter={() => prefetchRoute(item.to)}
              onFocus={() => prefetchRoute(item.to)}
              aria-label={item.label}
              title={item.label}
              className={({ isActive }) =>
                `${iconLinkClass} ${isActive ? 'bg-brand-soft text-brand-ink' : ''}`
              }
            >
              <Icon aria-hidden="true" className="size-5" />
            </NavLink>
          )
        })}
      </nav>
      <span aria-hidden="true" className="my-1 h-px w-8 bg-line" />
      <StarredProjectsMenu className={iconLinkClass} side="right" />
      <div className="mt-auto flex flex-col items-center gap-2">
        <DailyFocusButton className={iconLinkClass} />
        <button
          type="button"
          aria-label="Log out"
          title="Log out"
          onClick={() => setConfirmLogout(true)}
          className={`${iconLinkClass} text-danger hover:bg-danger/10 hover:text-danger`}
        >
          <LogOut aria-hidden="true" className="size-5" />
        </button>
      </div>
    </aside>
    <LogoutConfirmationDialog
      open={confirmLogout}
      onOpenChange={setConfirmLogout}
    />
    </>
  )
}
