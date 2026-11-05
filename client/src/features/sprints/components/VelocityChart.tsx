import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, CircleCheck, Gauge, TrendingUp, Zap } from 'lucide-react'
import type { Sprint } from '../../../shared/types/api'
import { computeVelocityAnalysis, type SprintVelocityPoint } from '../utils/velocityCalculator'
import { formatSprintDates } from '../utils/sprintDates'

interface VelocityChartProps {
  sprints: Sprint[]
}

export function VelocityChart({ sprints }: VelocityChartProps) {
  const analysis = computeVelocityAnalysis(sprints)
  const { points, averageVelocity, totalDeliveredPoints, totalSprints } = analysis
  const [selectedPoint, setSelectedPoint] = useState<SprintVelocityPoint | null>(null)

  if (totalSprints === 0) {
    return (
      <div className="theme-card grid place-content-center rounded-md p-12 text-center text-muted">
        <span className="mx-auto mb-3 grid size-12 place-content-center rounded-full bg-brand-soft text-brand-ink">
          <TrendingUp aria-hidden="true" className="size-6" />
        </span>
        <h3 className="font-heading text-body font-semibold text-ink">No velocity data yet</h3>
        <p className="mt-1 max-w-sm text-small">
          Complete at least one sprint to see delivery trends and estimate future capacity.
        </p>
      </div>
    )
  }

  const maxPoints = Math.max(
    ...points.map((point) => Math.max(point.committedPoints, point.donePoints)),
    averageVelocity,
    1,
  )
  const scaleMax = Math.ceil(maxPoints / 5) * 5 || 5
  const scaleTicks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <section className="theme-card grid min-w-0 gap-5 overflow-hidden rounded-md p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-heading font-semibold text-ink">
            <span className="grid size-8 place-content-center rounded-sm bg-brand-soft text-brand-ink">
              <Zap aria-hidden="true" className="size-4" />
            </span>
            Sprint velocity
          </h2>
          <p className="mt-1 text-small text-muted">
            Compare completed story points with each sprint’s original commitment.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-caption font-medium text-success">
          <TrendingUp aria-hidden="true" className="size-3.5" />
          {totalSprints} completed {totalSprints === 1 ? 'sprint' : 'sprints'}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <VelocityStat
          label="Average velocity"
          value={averageVelocity}
          suffix="pts / sprint"
          icon={Gauge}
          tone="brand"
        />
        <VelocityStat
          label="Delivered"
          value={totalDeliveredPoints}
          suffix="points total"
          icon={CircleCheck}
          tone="success"
        />
        <VelocityStat
          label="Peak sprint"
          value={analysis.highestVelocity}
          suffix="points delivered"
          icon={ArrowUpRight}
          tone="warning"
        />
        <VelocityStat
          label="Lowest sprint"
          value={analysis.lowestVelocity}
          suffix="points delivered"
          icon={ArrowDownRight}
          tone="info"
        />
      </div>

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-body font-semibold text-ink">Points per sprint</h3>
          <div className="flex flex-wrap items-center gap-3 text-caption text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-brand" />
              Delivered
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-sunken ring-1 ring-line-strong" />
              Committed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 border-s border-dashed border-warning" />
              Average
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,2fr)_auto] items-end gap-3 px-2 text-caption text-muted sm:grid-cols-[minmax(8rem,0.8fr)_minmax(0,2fr)_5rem]">
          <span>Sprint</span>
          <div className="relative flex justify-between">
            {scaleTicks.map((tick) => (
              <span key={tick} className="tabular-nums">
                {Math.round(scaleMax * tick)}
              </span>
            ))}
            <span className="absolute -end-1 translate-x-full">pts</span>
          </div>
          <span className="hidden text-end sm:block">Done / plan</span>
        </div>

        <div className="grid gap-1.5">
          {points.map((point) => {
            const committedWidth = (point.committedPoints / scaleMax) * 100
            const deliveredWidth = point.committedPoints > 0
              ? Math.min((point.donePoints / point.committedPoints) * 100, 100)
              : 0
            const selected = selectedPoint?.sprintId === point.sprintId

            return (
              <button
                key={point.sprintId}
                type="button"
                aria-pressed={selected}
                aria-label={`${point.name}: ${point.donePoints} points delivered of ${point.committedPoints} committed`}
                onMouseEnter={() => setSelectedPoint(point)}
                onMouseLeave={() => setSelectedPoint(null)}
                onFocus={() => setSelectedPoint(point)}
                onBlur={() => setSelectedPoint(null)}
                className={`grid min-h-12 grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,2fr)_auto] items-center gap-3 rounded-sm px-2 text-start transition-colors sm:grid-cols-[minmax(8rem,0.8fr)_minmax(0,2fr)_5rem] ${
                  selected ? 'bg-brand-soft/60' : 'hover:bg-canvas/80'
                }`}
              >
                <span className="min-w-0">
                  <span className={`block truncate text-small font-medium ${selected ? 'text-brand-ink' : 'text-ink'}`}>
                    {point.name}
                  </span>
                  <span className="block truncate text-caption text-muted">
                    {formatSprintDates(
                      sprints.find((sprint) => sprint.id === point.sprintId)?.startDate ?? null,
                      sprints.find((sprint) => sprint.id === point.sprintId)?.endDate ?? null,
                    )}
                  </span>
                </span>
                <span className="relative flex h-7 items-center">
                  {scaleTicks.slice(1).map((tick) => (
                    <span
                      key={tick}
                      aria-hidden="true"
                      className="absolute inset-y-0 z-0 border-s border-line/70"
                      style={{ left: `${tick * 100}%` }}
                    />
                  ))}
                  <span
                    className="relative z-10 h-3.5 min-w-1 overflow-hidden rounded-full bg-sunken ring-1 ring-inset ring-line/60"
                    style={{ width: `${Math.max(committedWidth, 0.8)}%` }}
                  >
                    <span
                      className="block h-full rounded-full bg-brand transition-[width]"
                      style={{ width: `${deliveredWidth}%` }}
                    />
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 z-20 border-s border-dashed border-warning"
                    style={{ left: `${(averageVelocity / scaleMax) * 100}%` }}
                  />
                </span>
                <span className="text-end font-mono text-caption tabular-nums text-ink">
                  {point.donePoints}<span className="text-muted"> / {point.committedPoints}</span>
                </span>
              </button>
            )
          })}
        </div>

        {selectedPoint && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-brand-soft-line bg-brand-soft/50 px-3 py-2 text-small">
            <span className="font-medium text-ink">{selectedPoint.name}</span>
            <span className="text-muted">
              {selectedPoint.completionRate}% completed
              {selectedPoint.carriedOver > 0 && ` · ${selectedPoint.carriedOver} carried over`}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

function VelocityStat({
  label,
  value,
  suffix,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  suffix: string
  icon: typeof Gauge
  tone: 'brand' | 'success' | 'warning' | 'info'
}) {
  const styles = {
    brand: { wrapper: 'bg-brand-soft/50', icon: 'bg-brand-soft text-brand-ink', value: 'text-brand-ink' },
    success: { wrapper: 'bg-success/5', icon: 'bg-success/10 text-success', value: 'text-success' },
    warning: { wrapper: 'bg-warning/5', icon: 'bg-warning/10 text-warning', value: 'text-warning' },
    info: { wrapper: 'bg-info/5', icon: 'bg-info/10 text-info', value: 'text-info' },
  }[tone]

  return (
    <article className={`min-w-0 rounded-md border border-line p-3 transition-colors hover:border-brand-soft-line ${styles.wrapper}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-caption font-medium text-muted">{label}</p>
        <span className={`grid size-7 shrink-0 place-content-center rounded-sm ${styles.icon}`}>
          <Icon aria-hidden="true" className="size-3.5" />
        </span>
      </div>
      <p className={`mt-2 font-heading text-title font-semibold tabular-nums ${styles.value}`}>{value}</p>
      <p className="text-caption text-muted">{suffix}</p>
    </article>
  )
}
