import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext } from './ThemeContext'
import type { Theme } from './ThemeContext'

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem('kanbot-theme')
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (themeColor) {
      const brand = getComputedStyle(root).getPropertyValue('--brand').trim()
      themeColor.content = brand || getComputedStyle(root).getPropertyValue('--canvas').trim()
    }
    localStorage.setItem('kanbot-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
