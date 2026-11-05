import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { aiApi } from '../api/ai.api'

export function useAiStatus() {
  return useQuery({
    queryKey: queryKeys.ai.status,
    queryFn: aiApi.status,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    meta: { handledInline: true },
  })
}
