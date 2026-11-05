import type { ReactNode } from 'react'

type AlertProps = {
  variant?: 'error' | 'warning'
  children: ReactNode
}

const variants = {
  error: 'border-danger/30 bg-danger/10',
  warning: 'border-warning/30 bg-warning/10',
}

export function Alert({ variant = 'error', children }: AlertProps) {
  return (
    <div role="alert" className={`flex items-center gap-2 rounded-sm border p-3 text-small text-ink ${variants[variant]}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 fill-none stroke-current stroke-2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 16.5v.5" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </div>
  )
}