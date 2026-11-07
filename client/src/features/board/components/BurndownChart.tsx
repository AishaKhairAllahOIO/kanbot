import { useState } from 'react'
import type { Sprint, Todo } from '@/shared/types/api'
import { computeBurndownData, type BurndownDay } from '@/features/board/utils/burndownCalculator'

interface BurndownChartProps {
  sprint: Sprint
  todos: Todo[]
}

export function BurndownChart({ sprint, todos }: BurndownChartProps) {
  const [hoveredDay, setHoveredDay] = useState<BurndownDay | null>(null)
  const data = computeBurndownData(sprint, todos)
  const { days, totalPoints, remainingPoints } = data

  const svgWidth = 680
  const svgHeight = 240
  const margin = { top: 20, right: 30, bottom: 40, left: 45 }
  const plotWidth = svgWidth - margin.left - margin.right
  const plotHeight = svgHeight - margin.top - margin.bottom

  const maxY = Math.max(totalPoints, 5)
  const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), maxY]

  function getX(index: number) {
    if (days.length <= 1) return margin.left + plotWidth / 2
    return margin.left + (index / (days.length - 1)) * plotWidth
  }

  function getY(points: number) {
    if (maxY === 0) return margin.top + plotHeight
    return margin.top + plotHeight - (points / maxY) * plotHeight
  }

  // Ideal path (always all days)
  const idealPath = days
    .map((day, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(day.idealPoints)}`)
    .join(' ')

  // Actual path (only days with actualPoints !== null)
  const actualDays = days.filter((d) => d.actualPoints !== null)
  const actualPath = actualDays
    .map((day, idx) => {
      const originalIdx = days.indexOf(day)
      return `${idx === 0 ? 'M' : 'L'} ${getX(originalIdx)} ${getY(day.actualPoints!)}`
    })
    .join(' ')

  // Skip labels if there are too many days to avoid crowding
  const labelInterval = days.length > 14 ? Math.ceil(days.length / 7) : days.length > 7 ? 2 : 1

  return (
    <div className="theme-card grid gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <h3 className="font-heading text-body font-semibold text-ink">Active Sprint Burndown</h3>
          <p className="text-caption text-muted">
            Tracking remaining story points across sprint timeline
          </p>
        </div>
        <div className="flex items-center gap-4 text-small">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-brand" />
            <span className="text-ink font-medium">Actual: {remainingPoints} pts remaining</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t-2 border-dashed border-muted" />
            <span className="text-muted">Ideal Guide</span>
          </span>
          <span className="rounded-full bg-sunken px-2 py-0.5 text-caption font-medium tabular-nums text-ink">
            {totalPoints} total pts
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="h-56 w-full min-w-[500px]"
          aria-label="Burndown chart"
        >
          {/* Horizontal grid lines & Y labels */}
          {yTicks.map((tick) => {
            const y = getY(tick)
            return (
              <g key={tick}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  className="stroke-line"
                  strokeDasharray="2 2"
                />
                <text
                  x={margin.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted font-mono text-[10px]"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* X axis labels */}
          {days.map((day, idx) => {
            if (idx % labelInterval !== 0 && idx !== days.length - 1) return null
            const x = getX(idx)
            return (
              <g key={day.date}>
                <line
                  x1={x}
                  y1={margin.top + plotHeight}
                  x2={x}
                  y2={margin.top + plotHeight + 4}
                  className="stroke-line"
                />
                <text
                  x={x}
                  y={margin.top + plotHeight + 16}
                  textAnchor="middle"
                  className={`font-mono text-[10px] ${day.isToday ? 'fill-brand-ink font-semibold' : 'fill-muted'}`}
                >
                  {day.label}
                </text>
              </g>
            )
          })}

          {/* Ideal line */}
          <path
            d={idealPath}
            fill="none"
            className="stroke-muted opacity-60"
            strokeWidth="2"
            strokeDasharray="5 5"
          />

          {/* Actual line */}
          {actualDays.length > 0 && (
            <path
              d={actualPath}
              fill="none"
              className="stroke-brand"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Actual points circles */}
          {actualDays.map((day) => {
            const idx = days.indexOf(day)
            const x = getX(idx)
            const y = getY(day.actualPoints!)
            const isHovered = hoveredDay?.date === day.date

            return (
              <g key={day.date}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  className={`cursor-pointer transition-all ${
                    day.isToday ? 'fill-brand stroke-on-brand stroke-2' : 'fill-surface stroke-brand stroke-2'
                  }`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              </g>
            )
          })}
        </svg>

        {/* Hover details badge */}
        {hoveredDay && (
          <div
            className="pointer-events-none absolute top-2 right-4 rounded-sm border border-line bg-raised p-2 text-caption shadow-pop"
          >
            <p className="font-semibold text-ink">{hoveredDay.label} {hoveredDay.isToday ? '(Today)' : ''}</p>
            <p className="text-brand-ink">Remaining: <strong>{hoveredDay.actualPoints} pts</strong></p>
            <p className="text-muted">Ideal target: {hoveredDay.idealPoints} pts</p>
          </div>
        )}
      </div>
    </div>
  )
}
