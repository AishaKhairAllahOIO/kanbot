import { request } from '@/shared/api/client'
import { AI_ENDPOINTS } from '../api/ai.endpoints'
import type {
  AiStatusResponse,
  ChatRequest,
  ChatResponse,
  GenerateTodosRequest,
  GenerateTodosResponse,
  PlanSprintRequest,
  PlanSprintResponse,
  SprintSummaryResponse,
} from '@/shared/types/api'

export const aiApi = {
  status: () => request<AiStatusResponse>('GET', AI_ENDPOINTS.STATUS),
  chat: (projectId: string, body: ChatRequest) =>
    request<ChatResponse>('POST', AI_ENDPOINTS.CHAT(projectId) , body),
  generateTodos: (projectId: string, body: GenerateTodosRequest) =>
    request<GenerateTodosResponse>('POST', AI_ENDPOINTS.GENERATE_TODOS(projectId), body),
  planSprint: (projectId: string, body: PlanSprintRequest) =>
    request<PlanSprintResponse>('POST', AI_ENDPOINTS.PLAN_SPRINT(projectId), body),
  summarizeSprint: (sprintId: string) =>
    request<SprintSummaryResponse>('POST', AI_ENDPOINTS.SPRINT_SUMMARY(sprintId)),
}