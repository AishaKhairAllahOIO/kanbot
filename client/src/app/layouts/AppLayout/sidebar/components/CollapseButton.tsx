import { ChevronDown } from 'lucide-react'

interface CollapseButtonProps {
  open: boolean
  onToggle: () => void
  controls: string
  label: string
}

export function CollapseButton({ open, onToggle, controls, label }: CollapseButtonProps) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      aria-label={`${open ? 'Collapse' : 'Expand'} ${label}`}
      onClick={onToggle}
      className="grid size-9 shrink-0 place-content-center rounded-sm text-muted hover:bg-sunken hover:text-ink"
    >
      <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${open ? '' : '-rotate-90'}`} />
    </button>
  )
}