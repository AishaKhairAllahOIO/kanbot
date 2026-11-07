import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/app/providers/theme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="topbar-action grid size-9 shrink-0 place-content-center rounded-sm p-2 text-muted hover:bg-sunken hover:text-brand-ink"
    >
      {theme === 'dark'
        ? <Sun aria-hidden="true" className="size-4" />
        : <Moon aria-hidden="true" className="size-4" />}
    </button>
  )
}