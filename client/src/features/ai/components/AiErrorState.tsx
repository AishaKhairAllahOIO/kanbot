import { CircleAlert } from 'lucide-react'
import { Button } from '../../../shared/components/Button'

interface AiErrorStateProps {
  message: string
  onRetry: () => void
  className?: string
}

export function AiErrorState({ message, onRetry, className = '' }: AiErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 p-3 text-small text-ink ${className}`}
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
      <div className="min-w-0">
        <p>{message}</p>
        <Button size="sm" variant="link" className="mt-1" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  )
}
