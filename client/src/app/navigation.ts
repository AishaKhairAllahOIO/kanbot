import { paths } from '../shared/config/paths'

const REDIRECT_PARAM = 'redirect'

export const DEFAULT_AUTHENTICATED_PATH = paths.projects

export function buildLoginPath(redirectTo?: string) {
  if (!redirectTo || redirectTo === paths.root) return paths.login
  return `${paths.login}?${REDIRECT_PARAM}=${encodeURIComponent(redirectTo)}`
}

export function getSafeRedirect(search: string) {
  const target = new URLSearchParams(search).get(REDIRECT_PARAM)
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return DEFAULT_AUTHENTICATED_PATH
  }
  if (target.startsWith(paths.login) || target.startsWith(paths.register)) return DEFAULT_AUTHENTICATED_PATH
  return target
}