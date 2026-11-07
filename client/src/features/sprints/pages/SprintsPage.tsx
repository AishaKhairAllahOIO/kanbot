import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowRight, CalendarDays, Check, Circle } from 'lucide-react'
import { getErrorMessage } from '../../../shared/api/errors'
import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Skeleton } from '../../../shared/components/Skeleton'
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle'
import type { Sprint } from '../../../shared/types/api'
import { Topbar } from '@/app/layouts'
import { useLayoutStore } from '@/app/layouts/AppLayout/store/layoutStore'
import { SprintListPanel } from '../components/SprintListPanel'
import { SprintOverviewPanel } from '../components/SprintOverviewPanel'
import { useSprints } from '../hooks/useSprints'

export function SprintsPage() {
  useDocumentTitle('Sprints History')
  const { projectId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const sprintsQuery = useSprints(projectId)
  const sprints = sprintsQuery.data?.sprints ?? []
  const selectedId = useLayoutStore((state) => state.selectedHistorySprintId)
  const setSelectedId = useLayoutStore((state) => state.setSelectedHistorySprintId)

  const selectedSprint: Sprint | null =
    sprints.find((sprint) => sprint.id === selectedId) ??
    sprints.find((sprint) => sprint.status === 'completed') ??
    sprints.find((sprint) => sprint.status === 'active') ??
    sprints[0] ??
    null

  useEffect(() => {
    const state = location.state as { focusSprintSummary?: boolean } | null
    if (!state?.focusSprintSummary || !selectedSprint) return

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById('sprint-ai-summary')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      navigate(`${location.pathname}${location.search}${location.hash}`, {
        replace: true,
        state: null,
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.hash, location.key, location.pathname, location.search, location.state, navigate, selectedSprint])

  const orderedSprints = [...sprints].sort((first, second) => {
    const statusOrder = { planned: 0, active: 1, completed: 2 }
    const statusDifference = statusOrder[first.status] - statusOrder[second.status]
    if (statusDifference !== 0) return statusDifference
    if (first.status === 'completed' && second.status === 'completed') {
      return (second.completedAt ?? '').localeCompare(first.completedAt ?? '')
    }
    return (first.startDate ?? '').localeCompare(second.startDate ?? '')
  })

  return (
    <>
      <Topbar
        title="Sprints History"
        meta={sprintsQuery.isLoading
          ? <span role="status" aria-label="Loading sprint summary"><Skeleton className="h-4 w-20" /></span>
          : <span className="shrink-0">{sprints.length} {sprints.length === 1 ? 'sprint' : 'sprints'}</span>}
      />
      <main className="page-gutter py-4 pb-8">
        {sprintsQuery.isLoading ? (
          <SprintHistorySkeleton />
        ) : sprintsQuery.isError ? (
          <EmptyState
            title="Sprints could not be loaded"
            description={getErrorMessage(sprintsQuery.error)}
            error
            action={<Button onClick={() => void sprintsQuery.refetch()}>Try again</Button>}
          />
        ) : sprints.length === 0 ? (
          <SprintHistoryEmptyState projectId={projectId} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr] lg:items-start">
            <SprintListPanel
              sprints={orderedSprints}
              selectedSprintId={selectedSprint?.id ?? null}
              onSelect={setSelectedId}
            />
            {selectedSprint ? (
              <SprintOverviewPanel sprint={selectedSprint} />
            ) : (
              <div className="grid place-content-center rounded-md border border-line bg-surface py-24 text-center text-muted">
                <p className="text-body">Select a sprint to view details.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}

function SprintHistoryEmptyState({ projectId }: { projectId: string }) {
  return (
    <section className="theme-card relative isolate overflow-hidden rounded-lg border border-line bg-surface px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)] lg:items-center lg:gap-12">
        <div className="grid justify-items-center text-center lg:justify-items-start lg:text-start">
          <span className="mb-4 grid size-14 place-content-center rounded-2xl bg-brand-soft text-brand-ink shadow-card">
            <CalendarDays aria-hidden="true" className="size-7" />
          </span>
          <h2 className="font-heading text-heading font-semibold tracking-tight text-ink sm:text-[1.65rem]">
            Make room for your first sprint
          </h2>
          <p className="mt-2 max-w-lg text-body text-muted">
            Choose a few backlog items to focus on, then track your progress and completed work here.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
            <Link
              to={`/projects/${projectId}/backlog`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-brand px-5 text-body font-medium text-on-brand transition-colors hover:bg-brand-hover"
            >
              Plan a sprint
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>

        <div aria-label="Example sprint timeline" className="rounded-lg border border-line bg-canvas/80 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div>
              <p className="text-small font-semibold text-ink">A clear path forward</p>
              <p className="mt-0.5 text-caption text-muted">Turn a plan into visible progress</p>
            </div>
            <span className="grid size-9 place-content-center rounded-full bg-info/10 text-info">
              <CalendarDays aria-hidden="true" className="size-4" />
            </span>
          </div>
          <div className="grid gap-3">
            <TimelineStep icon={<Circle aria-hidden="true" className="size-3.5" />} label="Set your focus" detail="Choose what you want to work on next" tone="info" />
            <div aria-hidden="true" className="ms-[1.05rem] h-4 border-s-2 border-dashed border-line-strong" />
            <TimelineStep icon={<CalendarDays aria-hidden="true" className="size-3.5" />} label="Work at your pace" detail="Keep track of each task as it moves forward" tone="brand" />
            <div aria-hidden="true" className="ms-[1.05rem] h-4 border-s-2 border-dashed border-line-strong" />
            <TimelineStep icon={<Check aria-hidden="true" className="size-3.5" />} label="Look back on progress" detail="See what you completed in your sprint history" tone="success" />
          </div>
        </div>
      </div>
    </section>
  )
}

function TimelineStep({
  icon,
  label,
  detail,
  tone,
}: {
  icon: React.ReactNode
  label: string
  detail: string
  tone: 'info' | 'brand' | 'success'
}) {
  const toneClasses = {
    info: 'bg-info/10 text-info',
    brand: 'bg-brand-soft text-brand-ink',
    success: 'bg-success/10 text-success',
  }[tone]

  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-surface p-3">
      <span className={`grid size-8 shrink-0 place-content-center rounded-full ${toneClasses}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-small font-semibold text-ink">{label}</p>
        <p className="truncate text-caption text-muted">{detail}</p>
      </div>
    </div>
  )
}

function SprintHistorySkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]" role="status" aria-label="Loading sprints">
      <aside className="grid content-start gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="theme-card grid gap-2 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        ))}
      </aside>
      <section className="theme-card grid content-start gap-4 p-4 sm:p-5">
        <div className="grid gap-2 border-b border-line pb-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="grid gap-2 rounded-md border border-line p-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
      </section>
    </div>
  )
}
