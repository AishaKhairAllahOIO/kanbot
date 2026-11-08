import { useCallback, useState } from 'react'
import { DAILY_QUOTES } from '../mocks/dailyQuotes'

const DAY_MS = 24 * 60 * 60 * 1000

function localDayNumber() {
  const now = new Date()
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / DAY_MS)
}

export function useDailyQuote() {
  const [offset, setOffset] = useState(0)
  const quote = DAILY_QUOTES[(localDayNumber() + offset) % DAILY_QUOTES.length]
  const next = useCallback(() => setOffset((value) => value + 1), [])
  return { quote, next }
}
