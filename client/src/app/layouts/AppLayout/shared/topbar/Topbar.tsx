import type { ReactNode } from 'react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CircleHelp, EllipsisVertical, Moon, PanelLeftClose, PanelLeftOpen, Search, Sparkles, Sun } from 'lucide-react'
import { useParams } from 'react-router'
import { useLayoutStore } from '@/app/layouts/AppLayout/store/layoutStore'
import { useCurrentProject } from '@/app/layouts/AppLayout/shared/hooks/useCurrentProject'
import { Button } from '@/shared/components/Button'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { useTheme } from '@/app/providers/theme'
import { Logo } from '@/shared/components/Logo'
import { paths } from '@/shared/config/paths'
import { useTopbarHost } from './components/useTopbarHost'
import { Breadcrumbs } from './components/Breadcrumbs'
import { UserMenu } from './components/UserMenu'
import { Tooltip } from '@/shared/components/Tooltip'
import { Link } from 'react-router'

interface TopbarProps {
  title: string
  meta?: ReactNode
}

export function Topbar({ title, meta }: TopbarProps) {
  const { projectId } = useParams()
  const { project, projectsLoading, projectsError, retryProjects } = useCurrentProject()
  const { theme, toggleTheme } = useTheme()
  const topbarHost = useTopbarHost()
  const isSidebarCollapsed = useLayoutStore((state) => state.isSidebarCollapsed)
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar)
  const setAssistantOpen = useLayoutStore((state) => state.setAssistantOpen)
  const setPaletteOpen = useLayoutStore((state) => state.setPaletteOpen)
  const setShortcutsOpen = useLayoutStore((state) => state.setShortcutsOpen)
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false)
  const paletteKeys =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
      ? '⌘K'
      : 'Ctrl K'

  if (!topbarHost) return null

  return createPortal(
    <header className="page-gutter flex h-topbar min-w-0 shrink-0 items-center justify-between gap-2 border-b border-line bg-canvas md:gap-3">
        <div className="flex min-w-0 flex-1 items-center">
          <div className="hidden w-auto shrink-0 items-center gap-3 md:flex md:w-[max(var(--sidebar-current),9rem)] md:justify-between md:gap-0">
            <Link to={paths.projects} className="flex shrink-0 items-center gap-2" aria-label="Kanbot projects">
              <Logo size={32} />
              <span className="font-heading text-heading font-semibold text-ink">Kanbot</span>
            </Link>
            <Tooltip content="Toggle sidebar">
              <button
                type="button"
                aria-label="Toggle sidebar"
                aria-controls="kanbot-sidebar"
                aria-expanded={!isSidebarCollapsed}
                onClick={toggleSidebar}
                className="hidden size-9 shrink-0 place-content-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-ink md:me-8 md:grid"
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
          <span aria-hidden="true" className="hidden size-8 shrink-0 md:block" />
          <div className="hidden items-center gap-1.5 md:flex md:gap-2">
            <ThemeToggle />
            <Tooltip content="Keyboard shortcuts (?)">
              <button
                type="button"
                aria-label="Keyboard shortcuts"
                onClick={() => setShortcutsOpen(true)}
                className="grid size-8 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-ink"
              >
                <CircleHelp aria-hidden="true" className="size-4" />
              </button>
            </Tooltip>
            <Tooltip content={`Open command palette (${paletteKeys})`}>
              <button
                type="button"
                aria-label={`Open command palette (${paletteKeys})`}
                onClick={() => setPaletteOpen(true)}
                className="flex h-8 min-w-28 items-center justify-start gap-2 rounded-sm border border-line bg-surface px-2 text-small text-muted hover:bg-sunken"
              >
                <Search aria-hidden="true" className="size-4 shrink-0" />
                <span>Search</span>
                <kbd dir="ltr" className="ms-auto rounded-xs border border-line bg-canvas px-1.5 py-0.5 font-mono text-caption">
                  {paletteKeys}
                </kbd>
              </button>
            </Tooltip>
            <Tooltip content={projectId ? 'Ask AI about this project' : 'Open a project to use Ask AI'}>
              <span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="min-h-8"
                  leadingIcon={<Sparkles aria-hidden="true" className="size-4" />}
                  disabled={!projectId}
                  onClick={() => setAssistantOpen(true)}
                >
                  Ask AI
                </Button>
              </span>
            </Tooltip>
          </div>
          <UserMenu />
          <DropdownMenu.Root open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label="More actions"
                className="grid size-9 shrink-0 place-content-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-ink md:hidden"
              >
                <EllipsisVertical aria-hidden="true" className="size-5" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-popover min-w-52 rounded-md border border-line bg-surface p-1 shadow-pop md:hidden"
              >
                <DropdownMenu.Item
                  className="menu-item"
                  onSelect={(event) => {
                    event.preventDefault()
                    toggleTheme()
                  }}
                >
                  {theme === 'dark'
                    ? <Sun aria-hidden="true" className="size-4" />
                    : <Moon aria-hidden="true" className="size-4" />}
                  Switch to {theme === 'dark' ? 'light' : 'dark'} theme
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-line" />
                <DropdownMenu.Item className="menu-item" onSelect={() => setPaletteOpen(true)}>
                  <Search aria-hidden="true" className="size-4" />
                  Search <span className="ms-auto text-caption text-muted">{paletteKeys}</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item className="menu-item" onSelect={() => setShortcutsOpen(true)}>
                  <CircleHelp aria-hidden="true" className="size-4" />
                  Keyboard shortcuts
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  disabled={!projectId}
                  className="menu-item"
                  onSelect={() => setAssistantOpen(true)}
                >
                  <Sparkles aria-hidden="true" className="size-4" />
                  Ask AI
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
    </header>,
    topbarHost,
  )
}
