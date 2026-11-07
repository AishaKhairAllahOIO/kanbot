import { useMemo } from 'react'
import { FolderKanban, History, ListTodo, PanelsTopLeft } from 'lucide-react'
import { paths } from '@/shared/config/paths'
import type { NavigationItem } from '../types/navigation-item'

export const PROJECTS_NAV_ITEM: NavigationItem = {
  to: paths.projects,
  label: 'Projects',
  icon: FolderKanban,
  enabled: true,
  end: true,
}

export function useProjectNavItems(projectId?: string): NavigationItem[] {
  return useMemo(() => {
    const enabled = Boolean(projectId)
    const to = (segment: string) => (projectId ? `/projects/${projectId}/${segment}` : paths.projects)
    return [
      { to: to('backlog'), label: 'Backlog', icon: ListTodo, enabled },
      { to: to('board'), label: 'Board', icon: PanelsTopLeft, enabled },
      { to: to('sprints'), label: 'Sprints History', icon: History, enabled },
    ]
  }, [projectId])
}
