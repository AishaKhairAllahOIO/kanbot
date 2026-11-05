import type { Sprint } from '../../../shared/types/api'

export interface SprintVelocityPoint {
  sprintId: string
  name: string
  completedAt: string | null
  committedPoints: number
  donePoints: number
  carriedOver: number
  completionRate: number
}

export interface VelocityAnalysis {
  points: SprintVelocityPoint[]
  averageVelocity: number
  totalDeliveredPoints: number
  totalSprints: number
  highestVelocity: number
  lowestVelocity: number
}

export function computeVelocityAnalysis(sprints: Sprint[]): VelocityAnalysis {
  const completed = sprints
    .filter((s) => s.status === 'completed' && s.completedStats)
    .sort((a, b) => {
      const dateA = a.completedAt ?? a.endDate ?? ''
      const dateB = b.completedAt ?? b.endDate ?? ''
      return dateA.localeCompare(dateB)
    })

  if (completed.length === 0) {
    return {
      points: [],
      averageVelocity: 0,
      totalDeliveredPoints: 0,
      totalSprints: 0,
      highestVelocity: 0,
      lowestVelocity: 0,
    }
  }

  const points: SprintVelocityPoint[] = completed.map((s) => {
    const stats = s.completedStats!
    const committed = stats.totalPoints
    const done = stats.donePoints
    const rate = committed > 0 ? Math.round((done / committed) * 100) : 0

    return {
      sprintId: s.id,
      name: s.name,
      completedAt: s.completedAt,
      committedPoints: committed,
      donePoints: done,
      carriedOver: stats.carriedOver,
      completionRate: rate,
    }
  })

  const totalDelivered = points.reduce((sum, p) => sum + p.donePoints, 0)
  const averageVelocity = Math.round((totalDelivered / points.length) * 10) / 10
  const velocities = points.map((p) => p.donePoints)
  const highestVelocity = Math.max(...velocities)
  const lowestVelocity = Math.min(...velocities)

  return {
    points,
    averageVelocity,
    totalDeliveredPoints: totalDelivered,
    totalSprints: points.length,
    highestVelocity,
    lowestVelocity,
  }
}

