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
        {leaves.map((leaf) => (
          <div
            key={`${leaf.side}-${leaf.bottom}`}
            className={`${styles.leaf} ${styles[leaf.side]}`}
            style={{
              bottom: `${leaf.bottom}px`,
              opacity: growth >= leaf.threshold ? 1 : 0,
            }}
          />
        ))}
        <div className={styles.bud} style={{ opacity: growth >= 0.88 ? 1 : 0 }} />
      </div>
      <div className={styles.soil} />
      <div className={styles.potRim} />
      <div className={styles.pot} />
    </div>
  )
}
