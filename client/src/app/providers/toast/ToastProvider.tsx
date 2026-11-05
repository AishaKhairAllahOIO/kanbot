import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { API_ERROR_TOAST_EVENT, ToastContext, type ToastContextValue, type ToastKind } from './ToastContext'

interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

const icons = {
  success: CircleCheck,
  info: Info,
  error: CircleAlert,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current.slice(-2), { id, message, kind }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, kind === 'error' ? 8000 : 4000)
  }, [])
  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast])

  useEffect(() => {
    function handleApiError(event: Event) {
      const message = (event as CustomEvent<unknown>).detail
      if (typeof message === 'string') showToast(message, 'error')
    }

    window.addEventListener(API_ERROR_TOAST_EVENT, handleApiError)
    return () => window.removeEventListener(API_ERROR_TOAST_EVENT, handleApiError)
  }, [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack fixed z-toast grid gap-2" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = icons[toast.kind]
          return (
            <div
              key={toast.id}
              role={toast.kind === 'error' ? 'alert' : 'status'}
              className="flex items-start gap-3 rounded-md border border-line bg-raised p-3 text-body text-ink shadow-pop"
            >
              <Icon
                aria-hidden="true"
                className={`mt-0.5 size-4 shrink-0 ${toast.kind === 'error' ? 'text-danger' : toast.kind === 'success' ? 'text-success' : 'text-info'}`}
              />
              <span className="min-w-0 flex-1 break-words">{toast.message}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                className="rounded-sm p-1 text-muted hover:bg-sunken"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
