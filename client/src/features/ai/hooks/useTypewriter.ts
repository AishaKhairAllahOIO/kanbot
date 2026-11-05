import { useEffect, useMemo, useState } from 'react'

export function useTypewriter(text: string, enabled: boolean, delay = 18) {
  const chunks = useMemo(() => text.match(/\S+\s*/g) ?? [], [text])
  const [visibleCount, setVisibleCount] = useState(() => enabled ? 0 : chunks.length)

  useEffect(() => {
    if (!enabled || visibleCount >= chunks.length) return
    const timer = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(count + 1, chunks.length))
    }, delay)
    return () => window.clearTimeout(timer)
  }, [chunks.length, delay, enabled, visibleCount])

  return {
    text: chunks.slice(0, visibleCount).join(''),
    isTyping: enabled && visibleCount < chunks.length,
    skip: () => setVisibleCount(chunks.length),
  }
}
