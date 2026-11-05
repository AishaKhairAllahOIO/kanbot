import { useSyncExternalStore } from 'react'

function subscribeToTopbarHost(onStoreChange: () => void) {
  if (typeof document === 'undefined' || !document.body) return () => {}

  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

function getTopbarHost() {
  return typeof document === 'undefined'
    ? null
    : document.getElementById('kanbot-topbar-host')
}

export function useTopbarHost() {
  return useSyncExternalStore(subscribeToTopbarHost, getTopbarHost, () => null)
}
