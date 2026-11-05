import { ClipboardCheck } from 'lucide-react'
import type { Todo } from '../../../shared/types/api'
import { useLayoutStore } from '../../../app/layouts/AppLayout/store/layoutStore'
import { Button } from '../../../shared/components/Button'
import { buildDailyStandupPrompt } from '../utils/dailyStandup'

export function DailyStandupButton({
  todos,
  activeSprintId,
  projectId,
  disabled = false,
}: {
  todos: Todo[]
  activeSprintId: string | null
  projectId: string
  disabled?: boolean
}) {
  const requestAssistantPrompt = useLayoutStore((state) => state.requestAssistantPrompt)

  return (
    <Button
      variant="secondary"
      disabled={disabled}
      leadingIcon={<ClipboardCheck aria-hidden="true" className="size-4" />}
      onClick={() => requestAssistantPrompt(projectId, buildDailyStandupPrompt(todos, activeSprintId))}
    >
      Prepare daily stand-up
    </Button>
  )
}
