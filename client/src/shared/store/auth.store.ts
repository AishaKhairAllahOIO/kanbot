import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SessionEnd = 'logout' | 'expired' | null

interface AuthState {
  token: string | null
  sessionEnd: SessionEnd
  setToken: (token: string) => void
  logout: () => void
  expireSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      sessionEnd: null,
      setToken: (token) => set({ token, sessionEnd: null }),
      logout: () => set({ token: null, sessionEnd: 'logout' }),
      expireSession: () => set({ token: null, sessionEnd: 'expired' }),
    }),
    { name: 'kanbot-auth', partialize: (state) => ({ token: state.token }) },
  ),
)