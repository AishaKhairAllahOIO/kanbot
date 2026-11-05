type ApiId = string | number;

export const SPRINTS_ENDPOINTS = {
  LIST: (projectId: ApiId) => `/projects/${projectId}/sprints`,
  CREATE: (projectId: ApiId) => `/projects/${projectId}/sprints`,
  DETAILS: (sprintId: ApiId) => `/sprints/${sprintId}`,
  BOARD: (sprintId: ApiId) => `/sprints/${sprintId}/todos`,
  UPDATE: (sprintId: ApiId) => `/sprints/${sprintId}`,
  DELETE: (sprintId: ApiId) => `/sprints/${sprintId}`,
  START: (sprintId: ApiId) => `/sprints/${sprintId}/start`,
  COMPLETE: (sprintId: ApiId) => `/sprints/${sprintId}/complete`,
} as const;
