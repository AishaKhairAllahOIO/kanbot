import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CalendarDays, FileText, ListPlus, Plus, UserRound, type LucideIcon } from 'lucide-react'

interface AssistantQuickActionsProps {
  onCreateTodos: () => void
  onPlanSprint: () => void
  onSummarize: () => void
  summarizeDisabled: boolean
  onDailyStandup: () => void
  dailyStandupDisabled: boolean
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: LucideIcon
  onSelect: () => void
  disabled?: boolean
  disabledHint?: string
}

export function AssistantQuickActions({
  onCreateTodos,
  onPlanSprint,
  onSummarize,
  summarizeDisabled,
  onDailyStandup,
  dailyStandupDisabled,
}: AssistantQuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'create-todos',
      title: 'Create todos',
      description: 'Turn an idea into backlog items',
      icon: Plus,
      onSelect: onCreateTodos,
    },
    {
      id: 'plan-sprint',
      title: 'Plan sprint',
      description: 'Pick scope for the next sprint',
      icon: CalendarDays,
      onSelect: onPlanSprint,
    },
    {
      id: 'summarize-sprint',
      title: 'Summarize sprint',
      description: 'Progress, blockers and risks',
      icon: FileText,
      onSelect: onSummarize,
      disabled: summarizeDisabled,
      disabledHint: 'Start a sprint to summarize it',
    },
    {
      id: 'daily-standup',
      title: 'Daily stand-up',
      description: 'Done, next and blocked',
      icon: UserRound,
      onSelect: onDailyStandup,
      disabled: dailyStandupDisabled,
    },
  ]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Quick actions"
          className="grid size-11 place-content-center rounded-md bg-brand-soft text-brand-ink transition-colors hover:bg-brand-soft-line"
        >
          <ListPlus aria-hidden="true" className="size-5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        side="bottom"
        sideOffset={6}
        className="z-popover w-72 max-w-[calc(100vw-2rem)] rounded-md border border-line bg-raised p-1.5 shadow-pop"
      >
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <DropdownMenu.Item
              key={action.id}
              disabled={action.disabled}
              title={action.disabled ? action.disabledHint : undefined}
              onSelect={() => action.onSelect()}
              className="menu-item items-start rounded-md p-2"
            >
              <span className="grid size-9 shrink-0 place-content-center rounded-md bg-brand-soft text-brand-ink">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="text-body font-medium text-ink">{action.title}</span>
                <span className="whitespace-nowrap text-small text-muted">{action.description}</span>
              </span>
            </DropdownMenu.Item>
          )
        })}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
