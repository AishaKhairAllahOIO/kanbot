export function logError(
  error: unknown,
  info: { componentStack?: string | null },
): void {
  console.error('Application error:', error, info.componentStack)
}