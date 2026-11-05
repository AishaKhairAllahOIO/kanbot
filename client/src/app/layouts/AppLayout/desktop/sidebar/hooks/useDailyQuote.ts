import { useCallback, useState } from 'react'

export interface Quote {
  text: string
  author: string
}

/** Local fallback list. The backend quote endpoint can replace the source later. */
const QUOTES: Quote[] = [
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'The key is not to prioritize what is on your schedule, but to schedule your priorities.', author: 'Stephen Covey' },
  { text: 'You can do anything, but not everything.', author: 'David Allen' },
  { text: 'Efficiency is doing things right; effectiveness is doing the right things.', author: 'Peter Drucker' },
  { text: 'Amateurs sit and wait for inspiration, the rest of us just get up and go to work.', author: 'Stephen King' },
  { text: 'Simplicity, the art of maximizing the amount of work not done, is essential.', author: 'Agile Manifesto' },
  { text: 'Lost time is never found again.', author: 'Benjamin Franklin' },
  {
    text: 'Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.',
    author: 'Paul J. Meyer',
  },
]

const DAY_MS = 24 * 60 * 60 * 1000

function localDayNumber() {
  const now = new Date()
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / DAY_MS)
}

/** One quote per day (stable), plus a refresh that moves to the next one. */
export function useDailyQuote() {
  const [offset, setOffset] = useState(0)
  const quote = QUOTES[(localDayNumber() + offset) % QUOTES.length]
  const next = useCallback(() => setOffset((value) => value + 1), [])
  return { quote, next }
}
