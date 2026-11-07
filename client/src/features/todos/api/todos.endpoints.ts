type ApiId = string | number;

export const TODOS_ENDPOINTS = {
  LIST: (projectId: ApiId) => `/projects/${projectId}/todos`,
  CREATE: (projectId: ApiId) => `/projects/${projectId}/todos`,
  BULK_CREATE: (projectId: ApiId) => `/projects/${projectId}/todos/bulk`,
  DETAILS: (todoId: ApiId) => `/todos/${todoId}`,
  UPDATE: (todoId: ApiId) => `/todos/${todoId}`,
  MOVE: (todoId: ApiId) => `/todos/${todoId}/move`,
  DELETE: (todoId: ApiId) => `/todos/${todoId}`,
  RESTORE: (todoId: ApiId) => `/todos/${todoId}/restore`,
} as const;
