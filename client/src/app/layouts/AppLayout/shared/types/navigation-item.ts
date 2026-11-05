import type { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  to: string
  label: string
  icon: LucideIcon
  enabled: boolean
  end?: boolean
}
