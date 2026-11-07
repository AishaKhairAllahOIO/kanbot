import { useMemo } from 'react'
import { useParams } from 'react-router'
import { useProjects } from '@/features/projects/hooks/useProjects'

export function useCurrentProject() {
  const { projectId } = useParams()
  const projectsQuery = useProjects()
  const projects = useMemo(() => projectsQuery.data?.projects ?? [], [projectsQuery.data?.projects])
  const project = projects.find((item) => item.id === projectId)

  return {
    projects,
    project,
    projectsLoading: projectsQuery.isLoading,
    projectsError: projectsQuery.isError,
    retryProjects: projectsQuery.refetch,
  }
}
