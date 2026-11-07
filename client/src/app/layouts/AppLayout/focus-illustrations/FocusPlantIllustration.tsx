import styles from './FocusPlantIllustration.module.css'

interface FocusPlantIllustrationProps {
  progress: number
  isRunning: boolean
}

const leaves = [
  { side: 'left', bottom: 52, threshold: 0.16 },
  { side: 'right', bottom: 65, threshold: 0.34 },
  { side: 'left', bottom: 78, threshold: 0.52 },
  { side: 'right', bottom: 91, threshold: 0.7 },
] as const

export function FocusPlantIllustration({
  progress,
  isRunning,
}: FocusPlantIllustrationProps) {
  const growth = Math.max(0, Math.min(1, progress))

  return (
    <div className={styles.plant} role="img" aria-label="Plant growing with focus progress">
      <div
        className={`${styles.foliage} ${isRunning ? styles.swaying : ''}`}
      >
        <div className={styles.stem} style={{ height: `${10 + growth * 53}px` }} />
        {leaves.map((leaf) => {
          const gradientId = `leaf-gradient-${leaf.side}-${leaf.bottom}`

          return (
            <div
              key={`${leaf.side}-${leaf.bottom}`}
              className={`${styles.leaf} ${styles[leaf.side]}`}
              style={{
                bottom: `${leaf.bottom}px`,
                opacity: growth >= leaf.threshold ? 1 : 0,
              }}
            >
              <svg viewBox="0 0 36 26" aria-hidden="true">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#91bd69" />
                    <stop offset="52%" stopColor="#5c984e" />
                    <stop offset="100%" stopColor="#347344" />
                  </linearGradient>
                </defs>
                <path
                  className={styles.leafBlade}
                  d="M3 22C5 10 16 2 33 3C31 16 19 25 3 22Z"
                  fill={`url(#${gradientId})`}
                />
                <path className={styles.leafVein} d="M4 21C15 16 24 9 32 4" />
                <path className={styles.leafBranch} d="M15 16L13 9M22 12L21 7" />
              </svg>
            </div>
          )
        })}
        <div className={styles.bud} style={{ opacity: growth >= 0.88 ? 1 : 0 }} />
      </div>
      <div className={styles.soil} />
      <div className={styles.potRim} />
      <div className={styles.pot} />
    </div>
  )
}
