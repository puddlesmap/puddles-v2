/** Shared analytics host gates — no PostHog/Plausible imports (safe on server). */

export const PRODUCTION_HOSTNAME = 'puddlesmap.com'

export function isProductionAnalyticsHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === PRODUCTION_HOSTNAME || host === `www.${PRODUCTION_HOSTNAME}`
}

export function isLocalhostAnalyticsHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

/** Localhost PostHog only when NEXT_PUBLIC_POSTHOG_DEBUG=true. */
export function isPostHogDebugLocalhost(): boolean {
  return isLocalhostAnalyticsHost() && process.env.NEXT_PUBLIC_POSTHOG_DEBUG === 'true'
}

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin')
}
