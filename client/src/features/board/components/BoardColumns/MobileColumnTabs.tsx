import { useEffect, useState, type RefObject } from 'react'
import { TODO_STATUSES, type Todo, type TodoStatus } from '@/shared/types/api'
import { statusNames } from '@/features/todos/config/statusConfig'

interface MobileColumnTabsProps {
  columns: Record<TodoStatus, Todo[]>
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

export function MobileColumnTabs({
  columns,
  scrollContainerRef,
}: MobileColumnTabsProps) {
  const [activeStatus, setActiveStatus] = useState<TodoStatus>('todo')

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const columnElements = Array.from(
      scrollContainer.querySelectorAll<HTMLElement>('[data-board-status]'),
    )
    const ratios = new Map<Element, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio))
        const visibleColumns = columnElements
          .map((element) => ({
            element,
            ratio: ratios.get(element) ?? 0,
            status: TODO_STATUSES.find(
              (status) => status === element.dataset.boardStatus,
            ),
          }))
          .filter(
            (column): column is { element: HTMLElement; ratio: number; status: TodoStatus } =>
              column.ratio > 0 && column.status !== undefined,
          )
        if (visibleColumns.length === 0) return

        const highestRatio = Math.max(...visibleColumns.map((column) => column.ratio))
        setActiveStatus((current) => {
          const currentColumn = visibleColumns.find((column) => column.status === current)
          const mostVisibleColumn = visibleColumns.find((column) => column.ratio === highestRatio)
          return currentColumn?.ratio === highestRatio
            ? current
            : mostVisibleColumn?.status ?? current
        })
      },
      { root: scrollContainer, threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    columnElements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [columns, scrollContainerRef])

  function scrollToColumn(status: TodoStatus) {
    const column = scrollContainerRef.current?.querySelector<HTMLElement>(
      `[data-board-status="${status}"]`,
    )
    if (!column) return

    column.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  return (
    <nav
      aria-label="Sprint board columns"
      className="-mx-6 bg-canvas px-6 py-2 lg:hidden"
    >
      <div className="flex gap-1 rounded-md bg-sunken p-1">
        {TODO_STATUSES.map((status) => {
          const isActive = activeStatus === status
          return (
            <button
              key={status}
              type="button"
              aria-pressed={isActive}
              onClick={() => scrollToColumn(status)}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-sm px-1 py-1.5 text-center text-caption font-medium ${
                isActive ? 'bg-surface text-brand-ink shadow-card' : 'text-muted'
              }`}
            >
              <span className="leading-tight">{statusNames[status]}</span>
              <span className="text-caption tabular-nums">{columns[status].length}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
