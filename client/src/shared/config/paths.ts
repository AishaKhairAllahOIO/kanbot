export const paths = {
  root: '/',
  login: '/login',
  register: '/register',
  profile: '/profile',
  projects: '/projects',
  project: (projectId: string) => `/projects/${projectId}`,
  backlog: (projectId: string) => `/projects/${projectId}/backlog`,
  board: (projectId: string) => `/projects/${projectId}/board`,
  sprints: (projectId: string) => `/projects/${projectId}/sprints`,
} as const

export const routePatterns = {
  project: '/projects/:projectId',
  backlog: '/projects/:projectId/backlog',
  board: '/projects/:projectId/board',
  sprints: '/projects/:projectId/sprints',
} as const
