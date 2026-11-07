import { Bot } from 'lucide-react'

export function AiChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-xs border border-brand-soft-line bg-brand-soft px-1.5 py-0.5 text-caption text-brand-ink">
      <Bot aria-hidden="true" className="size-3" />
      AI
    </span>
  )
}
