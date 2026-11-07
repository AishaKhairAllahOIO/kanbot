import { Pencil, X } from 'lucide-react'
import { getEffectiveLabelColor } from '@/features/todos/utils/labelColors'

interface LabelBadgeProps {
  projectId: string
  label: string
  className?: string
  onClick?: () => void
  onEdit?: () => void
  onRemove?: () => void
}

export function LabelBadge({
  projectId,
  label,
  className = '',
  onClick,
  onEdit,
  onRemove,
}: LabelBadgeProps) {
  const color = getEffectiveLabelColor(projectId, label)

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-caption font-medium transition-opacity ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      } ${className}`}
      style={{
        backgroundColor: color.bg,
        color: color.text,
        borderColor: color.border,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <span>{label}</span>
      {onEdit && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onEdit()
          }}
          aria-label={`Edit label ${label}`}
          className="hover:opacity-75"
        >
          <Pencil aria-hidden="true" className="size-3" />
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
          aria-label={`Remove label ${label}`}
          className="hover:opacity-75"
        >
          <X aria-hidden="true" className="size-3" />
        </button>
      )}
    </span>
  )
}