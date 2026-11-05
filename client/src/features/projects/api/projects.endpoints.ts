type ApiId = string | number;

export const PROJECTS_ENDPOINTS = {
  LIST: "/projects",
  CREATE: "/projects",
  DETAILS: (projectId: ApiId) => `/projects/${projectId}`,
  UPDATE: (projectId: ApiId) => `/projects/${projectId}`,
  DELETE: (projectId: ApiId) => `/projects/${projectId}`,
} as const;
