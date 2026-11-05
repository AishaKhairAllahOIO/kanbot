import { LoaderCircle } from 'lucide-react'

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-small text-muted">
      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      {label}
    </span>
  )
}
