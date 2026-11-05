type ApiId = string | number;

export const AI_ENDPOINTS = {
  STATUS: "/ai/status",
  CHAT: (projectId: ApiId) => `/projects/${projectId}/ai/chat`,
  GENERATE_TODOS: (projectId: ApiId) =>
    `/projects/${projectId}/ai/generate-todos`,
  PLAN_SPRINT: (projectId: ApiId) => `/projects/${projectId}/ai/plan-sprint`,
  SPRINT_SUMMARY: (sprintId: ApiId) => `/sprints/${sprintId}/ai/summary`,
} 
