import { request } from "../../../shared/api/client";
import type {
  BulkCreateTodosRequest,
  BulkCreateTodosResponse,
  CreateTodoRequest,
  MoveTodoRequest,
  Todo,
  TodoListQuery,
  UpdateTodoRequest,
} from "../../../shared/types/api";
import { TODOS_ENDPOINTS } from "../api/todos.endpoints";

function queryString(query: TodoListQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });
  return params.size ? `?${params.toString()}` : "";
}

export const todosApi = {
  list: (projectId: string, query: TodoListQuery = {}) =>
    request<{ todos: Todo[] }>(
      "GET",
      `${TODOS_ENDPOINTS.LIST(projectId)}${queryString(query)}`,
    ),

  get: (todoId: string) =>
    request<{ todo: Todo }>("GET", TODOS_ENDPOINTS.DETAILS(todoId)),

  create: (projectId: string, body: CreateTodoRequest) =>
    request<{ todo: Todo }>(
      "POST",
      TODOS_ENDPOINTS.CREATE(projectId),
      body,
    ),

  createMany: (projectId: string, body: BulkCreateTodosRequest) =>
    request<BulkCreateTodosResponse>(
      "POST",
      TODOS_ENDPOINTS.BULK_CREATE(projectId),
      body,
    ),

  update: (todoId: string, body: UpdateTodoRequest) =>
    request<{ todo: Todo }>("PATCH", TODOS_ENDPOINTS.UPDATE(todoId), body),

  move: (todoId: string, body: MoveTodoRequest) =>
    request<{ todo: Todo }>("POST", TODOS_ENDPOINTS.MOVE(todoId), body),

  remove: (todoId: string) =>
    request<void>("DELETE", TODOS_ENDPOINTS.DELETE(todoId)),

  restore: (todoId: string) =>
    request<{ todo: Todo }>("POST", TODOS_ENDPOINTS.RESTORE(todoId)),
};
