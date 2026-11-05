import { useMutation } from '@tanstack/react-query'
import { aiApi } from '../api/ai.api'
import type { PlanSprintRequest } from '../../../shared/types/api'

export function usePlanSprint(projectId: string) {
  return useMutation({
    mutationFn: (body: PlanSprintRequest) => aiApi.planSprint(projectId, body),
    meta: { handledInline: true },
  })
}