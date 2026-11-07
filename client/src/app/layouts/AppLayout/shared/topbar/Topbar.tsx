import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Bot, CircleHelp, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { useParams } from 'react-router'
import { useLayoutStore } from '@/app/layouts/AppLayout/store/layoutStore'
import { useCurrentProject } from '@/app/layouts/AppLayout/shared/hooks/useCurrentProject'
import { Button } from '@/shared/components/Button'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { Logo } from '@/shared/components/Logo'
import { paths } from '@/shared/config/paths'
import { useTopbarHost } from './hooks/useTopbarHost'
import { Breadcrumbs } from './components/Breadcrumbs'
import { UserMenu } from './components/UserMenu'
import { Tooltip } from '@/shared/components/Tooltip'
import { Link } from 'react-router'
import { NotificationCenter } from '@/features/notifications/components/NotificationCenter'

interface TopbarProps {
  title: string
  meta?: ReactNode
}

export function Topbar({ title, meta }: TopbarProps) {
  const { projectId } = useParams()
  const { project, projectsLoading, projectsError, retryProjects } = useCurrentProject()
  const topbarHost = useTopbarHost()
  const isSidebarCollapsed = useLayoutStore((state) => state.isSidebarCollapsed)
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar)
  const setAiPlanningTab = useLayoutStore((state) => state.setAiPlanningTab)
  const setPaletteOpen = useLayoutStore((state) => state.setPaletteOpen)
  const setShortcutsOpen = useLayoutStore((state) => state.setShortcutsOpen)
  const paletteKeys =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
      ? '⌘K'
      : 'Ctrl K'

  if (!topbarHost) return null

  return createPortal(
    <header className="app-topbar page-gutter flex h-topbar min-w-0 shrink-0 items-center justify-between gap-2 border-b border-line bg-canvas md:gap-3">
        <div className="flex min-w-0 flex-1 items-center">
          <div className="hidden shrink-0 items-center justify-center md:-ms-8 md:flex md:w-16 xl:hidden">
            <Link to={paths.projects} className="topbar-action grid size-10 place-content-center rounded-sm" aria-label="Kanbot projects">
              <Logo size={40} />
            </Link>
          </div>
          <div className="hidden w-auto shrink-0 items-center justify-between xl:flex xl:w-[var(--sidebar-width)] xl:pe-10">
            <Link to={paths.projects} className="topbar-action -ms-2 flex shrink-0 items-center gap-2 rounded-sm" aria-label="Kanbot projects">
              <Logo size={36} />
              <span className="font-heading text-heading font-semibold text-ink">Kanbot</span>
            </Link>
            <Tooltip content="Toggle sidebar">
              <button
                type="button"
                aria-label="Toggle sidebar"
                aria-controls="kanbot-sidebar"
                aria-expanded={!isSidebarCollapsed}
                onClick={toggleSidebar}
                className="topbar-action grid size-9 shrink-0 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-brand-ink"
              >
                {isSidebarCollapsed
                  ? <PanelLeftOpen aria-hidden="true" className="size-4" />
                  : <PanelLeftClose aria-hidden="true" className="size-4" />}
              </button>
            </Tooltip>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Breadcrumbs
              title={title}
              projectId={projectId}
              project={project}
              projectLoading={projectsLoading}
              projectError={projectsError}
              onRetryProject={retryProjects}
            />
            {meta && (
              <div className="hidden shrink-0 items-center gap-2 overflow-hidden text-small text-muted sm:flex">
                {meta}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <span aria-hidden="true" className="hidden size-9 shrink-0 md:block" />
          <Tooltip content="Toggle theme">
            <ThemeToggle />
          </Tooltip>
          <NotificationCenter />
          <div className="hidden items-center gap-1.5 md:flex md:gap-2">
            <Tooltip content="Keyboard shortcuts (Shift + ?)">
              <button
                type="button"
                aria-label="Keyboard shortcuts"
                onClick={() => setShortcutsOpen(true)}
                className="topbar-action grid size-9 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-brand-ink"
              >
                <CircleHelp aria-hidden="true" className="size-4" />
              </button>
            </Tooltip>
            <Tooltip content={`Open command palette (${paletteKeys})`}>
              <button
                type="button"
                aria-label={`Open command palette (${paletteKeys})`}
                onClick={() => setPaletteOpen(true)}
                className="topbar-action group grid size-9 place-content-center rounded-sm border border-line bg-surface text-muted hover:bg-sunken hover:text-brand-ink min-[960px]:flex min-[960px]:h-9 min-[960px]:w-auto min-[960px]:min-w-28 min-[960px]:items-center min-[960px]:justify-start min-[960px]:gap-2 min-[960px]:px-2"
              >
                <Search aria-hidden="true" className="size-4 shrink-0 text-brand-ink transition-transform duration-fast group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                <span className="hidden min-[960px]:inline">Search</span>
                <kbd dir="ltr" className="ms-auto hidden rounded-xs border border-line bg-canvas px-1.5 py-0.5 font-mono text-caption min-[960px]:inline">
                  {paletteKeys}
                </kbd>
              </button>
            </Tooltip>
          </div>
          <Tooltip content={projectId ? 'Ask AI about this project' : 'Open a project to use Ask AI'}>
            <span>
              <Button
                size="sm"
                variant="secondary"
                className="topbar-action min-h-9 hover:text-brand-ink"
                leadingIcon={<Bot aria-hidden="true" className="size-4" />}
                disabled={!projectId}
                onClick={() => setAiPlanningTab('chat')}
              >
                Ask AI
              </Button>
            </span>
          </Tooltip>
          <UserMenu />
        </div>
    </header>,
    topbarHost,
  )
}
