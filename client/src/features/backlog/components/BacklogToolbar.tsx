import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Popover from '@radix-ui/react-popover'
import {
  Check,
  ChevronDown,
  Download,
  Filter,
  Layers,
  Plus,
  Search,
  Settings2,
  Bot,
  Tag,
  X,
} from 'lucide-react'
import type { TodoPriority, TodoType } from '@/shared/types/api'
import { Button } from '@/shared/components/Button'
import { Tooltip } from '@/shared/components/Tooltip'
import { TODO_PRIORITIES, TODO_TYPES } from '@/shared/types/api'
import { priorityConfig, typeConfig } from '@/features/todos/config/todoConfig'

type FilterCategory = 'type' | 'priority' | 'labels'

const FILTER_CATEGORIES: { id: FilterCategory; label: string; icon: typeof Layers }[] = [
  { id: 'type', label: 'Type', icon: Layers },
  { id: 'priority', label: 'Priority', icon: Filter },
  { id: 'labels', label: 'Labels', icon: Tag },
]

const PRIORITY_OPTIONS = [...TODO_PRIORITIES].reverse().map((value) => ({
  value,
  ...priorityConfig[value],
}))

const TYPE_OPTIONS = TODO_TYPES.map((value) => ({
  value,
  ...typeConfig[value],
}))

interface BacklogToolbarProps {
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  priority: TodoPriority | ''
  setPriority: Dispatch<SetStateAction<TodoPriority | ''>>
  type: TodoType | ''
  setType: Dispatch<SetStateAction<TodoType | ''>>
  label: string
  setLabel: Dispatch<SetStateAction<string>>
  availableLabels: string[]
  onClearFilters: () => void
  onManageLabels: () => void
  onOpenSprintTemplate: () => void
  onExportCsv: () => void
  onExportMarkdown: () => void
  onGenerate: () => void
  onPlanSprint: () => void
  onCreateSprint: () => void
}

export function BacklogToolbar({
  search,
  setSearch,
  priority,
  setPriority,
  type,
  setType,
  label,
  setLabel,
  availableLabels,
  onClearFilters,
  onManageLabels,
  onOpenSprintTemplate,
  onExportCsv,
  onExportMarkdown,
  onGenerate,
  onPlanSprint,
  onCreateSprint,
}: BacklogToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('type')
  const [draftPriority, setDraftPriority] = useState<TodoPriority | ''>(priority)
  const [draftType, setDraftType] = useState<TodoType | ''>(type)
  const [draftLabel, setDraftLabel] = useState(label)
  const activeFilterCount = Number(Boolean(priority)) + Number(Boolean(type)) + Number(Boolean(label))

  function handleFilterOpenChange(open: boolean) {
    if (open) {
      setDraftPriority(priority)
      setDraftType(type)
      setDraftLabel(label)
    }
    setFilterOpen(open)
  }

  function clearDraftFilters() {
    setDraftPriority('')
    setDraftType('')
    setDraftLabel('')
    setSearch('')
    onClearFilters()
  }

  function applyFilters() {
    setPriority(draftPriority)
    setType(draftType)
    setLabel(draftLabel)
    setFilterOpen(false)
  }

  const categoryCount = (category: FilterCategory) => {
    if (category === 'type') return Number(Boolean(draftType))
    if (category === 'priority') return Number(Boolean(draftPriority))
    return Number(Boolean(draftLabel))
  }

  return (
    <div className="page-gutter flex flex-col gap-3 border-b border-line bg-canvas py-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <label className="relative min-w-48 flex-1 sm:max-w-xs">
          <span className="sr-only">Search todos</span>
          <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-brand-ink" />
          <input
            data-shortcut-search
            type="search"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search todos..."
            className="h-10 w-full rounded-sm  border-line bg-surface ps-9 pe-3 text-body text-ink placeholder:text-subtle"
          />
          <kbd dir="ltr" className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 rounded-xs border border-line bg-sunken px-1.5 py-0.5 font-mono text-caption text-muted">
            /
          </kbd>
         </label>

        <Popover.Root open={filterOpen} onOpenChange={handleFilterOpenChange}>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label={activeFilterCount ? `Filters, ${activeFilterCount} active` : 'Filters'}
              className={`inline-flex h-9 items-center gap-2 rounded-sm border px-3 text-small font-medium transition-colors ${
                activeFilterCount
                  ? 'border-brand-soft-line bg-brand-soft text-brand-ink'
                  : 'border-line-strong bg-surface text-ink hover:bg-sunken'
              }`}
            >
              <Filter aria-hidden="true" className="size-4 text-brand-ink" />
              Filter
              {activeFilterCount > 0 && (
                <span className="grid size-5 place-content-center rounded-full bg-brand text-caption font-semibold text-on-brand">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown aria-hidden="true" className={`size-3.5 text-brand-ink transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={6}
              className="z-popover w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-line bg-raised shadow-pop"
            >
              <div className="grid min-h-52 grid-cols-[7rem_minmax(0,1fr)]">
                <div className="border-e border-line bg-canvas/70 p-2">
                  {FILTER_CATEGORIES.map((category) => {
                    const Icon = category.icon
                    const selectedCount = categoryCount(category.id)
                    return (
                      <button
                        key={category.id}
                        type="button"
                        aria-pressed={activeCategory === category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`flex min-h-9 w-full items-center gap-2 rounded-sm px-2 text-start text-small transition-colors ${
                          activeCategory === category.id
                            ? 'bg-brand-soft font-medium text-brand-ink'
                            : 'text-muted hover:bg-sunken hover:text-ink'
                        }`}
                      >
                        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{category.label}</span>
                        {selectedCount > 0 && (
                          <span className="grid size-4 shrink-0 place-content-center rounded-full bg-surface text-caption text-brand-ink">
                            {selectedCount}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="grid content-start gap-1 p-2">
                  {activeCategory === 'type' && TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const selected = draftType === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setDraftType(selected ? '' : option.value)}
                        className="flex min-h-9 items-center gap-2 rounded-sm px-1.5 text-small text-ink transition-colors hover:bg-sunken"
                      >
                        <span className={`grid size-4 place-content-center rounded-xs border ${selected ? 'border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface'}`}>
                          {selected && <Check aria-hidden="true" className="size-3" />}
                        </span>
                        <Icon aria-hidden="true" className={`size-4 ${option.className}`} />
                        <span>{option.label}</span>
                      </button>
                    )
                  })}
                  {activeCategory === 'priority' && PRIORITY_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const selected = draftPriority === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setDraftPriority(selected ? '' : option.value)}
                        className="flex min-h-9 items-center gap-2 rounded-sm px-1.5 text-small text-ink transition-colors hover:bg-sunken"
                      >
                        <span className={`grid size-4 place-content-center rounded-xs border ${selected ? 'border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface'}`}>
                          {selected && <Check aria-hidden="true" className="size-3" />}
                        </span>
                        <Icon aria-hidden="true" className={`size-4 ${option.className}`} />
                        <span>{option.label}</span>
                      </button>
                    )
                  })}
                  {activeCategory === 'labels' && (
                    <>
                      {availableLabels.length ? availableLabels.map((availableLabel) => {
                        const selected = draftLabel === availableLabel
                        return (
                          <button
                            key={availableLabel}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setDraftLabel(selected ? '' : availableLabel)}
                            className="flex min-h-9 min-w-0 items-center gap-2 rounded-sm px-1.5 text-start text-small text-ink transition-colors hover:bg-sunken"
                          >
                            <span className={`grid size-4 shrink-0 place-content-center rounded-xs border ${selected ? 'border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface'}`}>
                              {selected && <Check aria-hidden="true" className="size-3" />}
                            </span>
                            <Tag aria-hidden="true" className="size-3.5 shrink-0 text-brand-ink" />
                            <span className="truncate">{availableLabel}</span>
                          </button>
                        )
                      }) : (
                        <p className="px-2 py-3 text-caption text-muted">No labels in this backlog.</p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFilterOpen(false)
                          onManageLabels()
                        }}
                        className="mt-1 flex min-h-8 items-center gap-2 rounded-sm px-1.5 text-small font-medium text-brand-ink hover:bg-brand-soft"
                      >
                        <Settings2 aria-hidden="true" className="size-3.5" />
                        Manage labels
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-line bg-canvas/70 p-2">
                <button
                  type="button"
                  onClick={clearDraftFilters}
                  disabled={!activeFilterCount && !search}
                  className="inline-flex min-h-8 items-center gap-1 rounded-sm px-2 text-small text-muted transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X aria-hidden="true" className="size-3.5" />
                  Clear all
                </button>
                <Button size="sm" variant="primary" onClick={applyFilters}>
                  Apply filters
                </Button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              size="sm"
              variant="secondary"
              leadingIcon={<Download aria-hidden="true" className="size-3.5 text-brand-ink" />}
            >
              Export
              <ChevronDown aria-hidden="true" className="size-3.5 text-brand-ink" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-popover w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-content-available-width)] rounded-md border border-line bg-raised p-1 shadow-pop"
            >
              <DropdownMenu.Item className="menu-item" onSelect={onExportCsv}>
                CSV
              </DropdownMenu.Item>
              <DropdownMenu.Item className="menu-item" onSelect={onExportMarkdown}>
                Markdown
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <Tooltip content="Configure default sprint duration and capacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenSprintTemplate}
            leadingIcon={<Settings2 aria-hidden="true" className="size-3.5 text-brand-ink" />}
          >
            Templates
          </Button>
        </Tooltip>

        <DropdownMenu.Root>
          <Tooltip content="Generate todos or plan a sprint with AI">
            <DropdownMenu.Trigger asChild>
              <Button
                size="sm"
                variant="secondary"
                leadingIcon={<Bot aria-hidden="true" className="size-3.5 text-brand-ink" />}
              >
                AI actions
                <ChevronDown aria-hidden="true" className="size-3.5 text-brand-ink" />
              </Button>
            </DropdownMenu.Trigger>
          </Tooltip>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-popover w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-content-available-width)] rounded-md border border-line bg-raised p-1 shadow-pop"
            >
              <Tooltip content="Generate suggested todos from a feature description">
                <DropdownMenu.Item className="menu-item" onSelect={onGenerate}>
                  Generate todos
                </DropdownMenu.Item>
              </Tooltip>
              <Tooltip content="Create an AI-recommended sprint plan">
                <DropdownMenu.Item className="menu-item" onSelect={onPlanSprint}>
                  Plan sprint
                </DropdownMenu.Item>
              </Tooltip>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <Button size="sm" variant="primary" leadingIcon={<Plus aria-hidden="true" className="size-4" />} onClick={onCreateSprint}>
          Create sprint
        </Button>
      </div>
    </div>
  )
}
