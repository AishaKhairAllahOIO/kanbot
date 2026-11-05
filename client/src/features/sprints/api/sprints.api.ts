import { request } from "../../../shared/api/client";
import { SPRINTS_ENDPOINTS } from "../api/sprints.endpoints";
import type {
  CompleteSprintRequest,
  CreateSprintRequest,
  Sprint,
  SprintBoardResponse,
  StartSprintRequest,
  UpdateSprintRequest,
} from "../../../shared/types/api";

export const sprintsApi = {
  list: (projectId: string) =>
    request<{ sprints: Sprint[] }>("GET", SPRINTS_ENDPOINTS.LIST(projectId)),
  get: (sprintId: string) =>
    request<{ sprint: Sprint }>("GET", SPRINTS_ENDPOINTS.DETAILS(sprintId)),
  board: (sprintId: string) =>
    request<SprintBoardResponse>("GET", SPRINTS_ENDPOINTS.BOARD(sprintId)),
  create: (projectId: string, body: CreateSprintRequest) =>
    request<{ sprint: Sprint }>(
      "POST",
      SPRINTS_ENDPOINTS.CREATE(projectId),
      body,
    ),
  update: (sprintId: string, body: UpdateSprintRequest) =>
    request<{ sprint: Sprint }>(
      "PATCH",
      SPRINTS_ENDPOINTS.UPDATE(sprintId),
      body,
    ),
  remove: (sprintId: string) =>
    request<void>("DELETE", SPRINTS_ENDPOINTS.DELETE(sprintId)),
  start: (sprintId: string, body: StartSprintRequest) =>
    request<{ sprint: Sprint }>(
      "POST",
      SPRINTS_ENDPOINTS.START(sprintId),
      body,
    ),
  complete: (sprintId: string, body: CompleteSprintRequest) =>
    request<{ sprint: Sprint }>(
      "POST",
      SPRINTS_ENDPOINTS.COMPLETE(sprintId),
      body,
    ),
};
