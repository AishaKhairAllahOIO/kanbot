import { useMutation } from '@tanstack/react-query'
import { aiApi } from '../api/ai.api'
import type { ChatRequest } from '../../../shared/types/api'

export function useAiChat(projectId: string) {
  return useMutation({
    mutationFn: (body: ChatRequest) => aiApi.chat(projectId, body),
    meta: { handledInline: true },
  })
}