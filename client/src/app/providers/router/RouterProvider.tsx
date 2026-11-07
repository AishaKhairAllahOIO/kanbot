import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router'

export function RouterProvider({ children }: { children: ReactNode }) {
  return (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    {children}
  </BrowserRouter>
)

}
