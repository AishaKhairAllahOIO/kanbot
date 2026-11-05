import type { TodoListQuery } from "../types/api";

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  projects: {
    all: ["projects"] as const,
    detail: (projectId: string) => ["project", projectId] as const,
  },
  todos: {
    all: (projectId: string) => ["todos", projectId] as const,
    list: (projectId: string, filters: TodoListQuery = {}) =>
      ["todos", projectId, filters] as const,
    detail: (todoId: string | null) => ["todo", todoId] as const,
  },
  sprints: {
    list: (projectId: string) => ["sprints", projectId] as const,
    detail: (sprintId: string) => ["sprint", sprintId] as const,
    board: (sprintId: string) => ["board", sprintId] as const,
    boards: ["board"] as const,
  },
  ai: {
    status: ["ai-status"] as const,
  },
} as const;
