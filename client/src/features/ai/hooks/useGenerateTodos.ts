import { useMutation } from '@tanstack/react-query'
import { aiApi } from '../api/ai.api'
import type { GenerateTodosRequest } from '../../../shared/types/api'

export function useGenerateTodos(projectId: string) {
  return useMutation({
    mutationFn: (body: GenerateTodosRequest) => aiApi.generateTodos(projectId, body),
    meta: { handledInline: true },
  })
}