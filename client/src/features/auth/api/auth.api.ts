import { api } from '../../../shared/api/client'
import { AUTH_ENDPOINTS } from '../api/auth.endpoints'
import type { AuthResponse, LoginRequest, MeResponse, RegisterRequest } from '../../../shared/types/api'

export const authApi = {
  register: (values: RegisterRequest) => api.post<AuthResponse>(AUTH_ENDPOINTS.REGISTER, values).then((res) => res.data),
  login: (values: LoginRequest) => api.post<AuthResponse>(AUTH_ENDPOINTS.LOGIN, values).then((res) => res.data),
  me: () => api.get<MeResponse>(AUTH_ENDPOINTS.ME).then((res) => res.data),
}