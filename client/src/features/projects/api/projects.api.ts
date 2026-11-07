import { request } from "../../../shared/api/client";
import type {
  CreateProjectRequest,
  ProjectWithStats,
  UpdateProjectRequest,
} from "../../../shared/types/api";
import { PROJECTS_ENDPOINTS } from "../api/projects.endpoints";

export const projectsApi = {
  list: () =>
    request<{ projects: ProjectWithStats[] }>("GET", PROJECTS_ENDPOINTS.LIST),
  get: (projectId: string) =>
    request<{ project: ProjectWithStats }>(
      "GET",
      PROJECTS_ENDPOINTS.DETAILS(projectId),
    ),
  create: (body: CreateProjectRequest) =>
    request<{ project: ProjectWithStats }>(
      "POST",
      PROJECTS_ENDPOINTS.CREATE,
      body,
    ),
  update: (projectId: string, body: UpdateProjectRequest) =>
    request<{ project: ProjectWithStats }>(
      "PATCH",
      PROJECTS_ENDPOINTS.UPDATE(projectId),
      body,
    ),
  remove: (projectId: string) =>
    request<void>("DELETE", PROJECTS_ENDPOINTS.DELETE(projectId)),
};
