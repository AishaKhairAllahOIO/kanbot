export const loadLoginPage = () => import('@/features/auth/pages/LoginPage')
export const loadRegisterPage = () => import('@/features/auth/pages/RegisterPage')
export const loadBacklogPage = () => import('@/features/backlog/pages/BacklogPage')
export const loadBoardPage = () => import('@/features/board/pages/BoardPage')
export const loadSprintsPage = () => import('@/features/sprints/pages/SprintsPage')
export const loadProfilePage = () => import('@/features/profile/pages/ProfilePage')

type PrefetchableRoute = 'backlog' | 'board' | 'sprints' | 'profile'

const routeLoaders = {
  backlog: loadBacklogPage,
  board: loadBoardPage,
  sprints: loadSprintsPage,
  profile: loadProfilePage,
}

export function prefetchRoute(path: string) {
  const route: PrefetchableRoute | undefined = path.endsWith('/backlog')
    ? 'backlog'
    : path.endsWith('/board')
      ? 'board'
      : path.endsWith('/sprints')
        ? 'sprints'
        : path.endsWith('/profile')
          ? 'profile'
          : undefined

  if (!route) return
  void routeLoaders[route]().catch((error: unknown) => {
    console.error(`Unable to prefetch the ${route} page`, error)
  })
}
