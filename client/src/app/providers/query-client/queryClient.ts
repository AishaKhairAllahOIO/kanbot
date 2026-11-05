import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError, getErrorMessage } from '@/shared/api/errors'
import { dispatchApiErrorToast } from '@/app/providers/toast/ToastContext'

function showUnhandledError(error: unknown, meta: Record<string, unknown> | undefined) {
  if (meta?.handledInline || (error instanceof ApiError && error.code === 'VALIDATION_ERROR')) return
  dispatchApiErrorToast(getErrorMessage(error))
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => showUnhandledError(error, query.meta),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) =>
      showUnhandledError(error, mutation.meta),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
        return error instanceof ApiError && error.isNetworkError && failureCount < 1
      },
    },
    mutations: {
      retry: false,
    },
  },
})
