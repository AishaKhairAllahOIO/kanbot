import { createContext } from 'react'

export type ToastKind = 'success' | 'info' | 'error'

export interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export const API_ERROR_TOAST_EVENT = 'kanbot:api-error-toast'

export function dispatchApiErrorToast(message: string) {
  window.dispatchEvent(new CustomEvent(API_ERROR_TOAST_EVENT, { detail: message }))
}
