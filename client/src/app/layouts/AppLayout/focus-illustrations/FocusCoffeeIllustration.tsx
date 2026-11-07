import styles from './FocusCoffeeIllustration.module.css'

interface FocusCoffeeIllustrationProps {
  progress: number
  isRunning: boolean
}

export function FocusCoffeeIllustration({
  progress,
  isRunning,
}: FocusCoffeeIllustrationProps) {
  const coffeeLevel = Math.max(0, Math.min(1, 1 - progress))

  return (
    <div
      className={`${styles.scene} ${isRunning ? styles.steamOn : ''}`}
      data-finished={progress >= 1}
      role="img"
      aria-label={`Coffee break ${Math.round(progress * 100)} percent complete`}
    >
      <div className={styles.steam} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className={styles.cupHandle} aria-hidden="true" />
      <div className={styles.cup} aria-hidden="true">
        <div className={styles.liquid} style={{ height: `${coffeeLevel * 76}%` }}>
          <div className={styles.crema} />
        </div>
        <div className={styles.rim} />
      </div>
      <div className={styles.saucer} aria-hidden="true" />
      <div className={styles.sparkle} aria-hidden="true" />
    </div>
  )
}
