export function scrollBacklogSectionIntoView(element: HTMLElement) {
  const main = element.closest('main')
  if (!main) return

  const elementTop = element.getBoundingClientRect().top
  const mainTop = main.getBoundingClientRect().top
  const top = main.scrollTop + elementTop - mainTop - 16
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'instant'
    : 'smooth'

  main.scrollTo({ top: Math.max(0, top), behavior })
}
