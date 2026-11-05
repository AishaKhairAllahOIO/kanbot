import type { ReactNode } from 'react'
import { SessionBoundary } from '@/app/components/routing/SessionBoundary'
import { QueryClientProvider } from './query-client'
import { RouterProvider } from './router'
import { ThemeProvider } from './theme'
import { ToastProvider } from './toast'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider>
      <RouterProvider>
        <ThemeProvider>
          <ToastProvider>
            <SessionBoundary>{children}</SessionBoundary>
          </ToastProvider>
        </ThemeProvider>
      </RouterProvider>
    </QueryClientProvider>
  )
}
