/** Shared production host gate — no PostHog/Plausible imports (safe on server). */

export const PRODUCTION_HOSTNAME = 'puddlesmap.com'

export function isProductionAnalyticsHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === PRODUCTION_HOSTNAME || host === `www.${PRODUCTION_HOSTNAME}`
}

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin')
}
