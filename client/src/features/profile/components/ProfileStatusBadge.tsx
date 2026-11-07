import { Tooltip } from '@/shared/components/Tooltip'
import { useProfileStatus } from '../hooks/useProfileStatus'
import { getProfileStatusLabel, profileStatuses } from '../config/profileStatuses'

export function ProfileStatusBadge() {
  const { value } = useProfileStatus()
  const status = profileStatuses.find(({ id }) => id === value?.status)
  const StatusIcon = status?.icon

  return (
    <Tooltip content={getProfileStatusLabel(value?.status)} side="bottom">
      <span
        role="img"
        aria-label={getProfileStatusLabel(value?.status)}
        className={`absolute -bottom-0.5 -end-0.5 grid size-3.5 place-content-center rounded-full border-2 border-surface shadow-sm ${
          status?.color ?? 'bg-muted'
        }`}
      >
        {StatusIcon && <StatusIcon aria-hidden="true" className="size-2 text-white" />}
      </span>
    </Tooltip>
  )
}
