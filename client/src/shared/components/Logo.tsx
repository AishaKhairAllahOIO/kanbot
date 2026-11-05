import mark from '../../assets/brand/mark.svg'
import full from '../../assets/brand/full.svg'
import fullDark from '../../assets/brand/full-dark.svg'
import tagline from '../../assets/brand/tagline.svg'

interface LogoProps {
  variant?: 'mark' | 'full' | 'tagline'
  size?: number
  className?: string
}

export function Logo({ variant = 'mark', size = 40, className = '' }: LogoProps) {
  if (variant === 'mark') {
    return <img src={mark} width={size} height={size} alt="Kanbot" className={className} />
  }

  return (
    <>
      <img src={full} width={size} alt="Kanbot" className={`dark:hidden ${className}`} style={{ height: 'auto' }} />
      <img
        src={variant === 'tagline' ? tagline : fullDark}
        width={size}
        alt={variant === 'tagline' ? 'Kanbot — Your sprint board with an AI teammate.' : 'Kanbot'}
        className={`hidden dark:block ${className}`}
        style={{ height: 'auto' }}
      />
    </>
  )
}
