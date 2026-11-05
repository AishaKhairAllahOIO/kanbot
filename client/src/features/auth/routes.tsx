import type { RouteObject } from 'react-router'
import { AuthLayout } from '@/app/layouts'
import { GuestRoute } from '@/app/components/routing'
import { paths } from '../../shared/config/paths'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

export const authRoutes: RouteObject[] = [
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: paths.login, element: <LoginPage /> },
          { path: paths.register, element: <RegisterPage /> },
        ],
      },
    ],
  },
]