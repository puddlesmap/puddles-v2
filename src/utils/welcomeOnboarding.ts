export const WELCOME_LAUNCH_CITIES = ['Palo Alto', 'Los Altos', 'Mountain View'] as const

export const WELCOME_CTA_DISMISS_DAYS = 30
export const WELCOME_FAB_MIN_DELAY_MS = 2500

export const WELCOME_STORAGE_KEYS = {
  seen: 'puddles_welcome_seen_v1',
  submitted: 'puddles_neighborhood_submitted_v1',
  ctaDismissedUntil: 'puddles_nearby_cta_dismissed_until',
} as const

/** Experiment-only namespace (tester harness). */
export const WELCOME_EXPERIMENT_STORAGE_KEYS = {
  seen: 'puddles_welcome_seen_experiment_v1',
  submitted: 'puddles_neighborhood_submitted_experiment_v1',
  ctaDismissedUntil: 'puddles_nearby_cta_dismissed_until_experiment',
} as const

export type WelcomeStorageKeys = {
  seen: string
  submitted: string
  ctaDismissedUntil: string
}

export type WelcomeOnboardingPhase = 'intro' | 'request' | 'success'

export type WelcomeNearbySource = 'welcome' | 'floating_cta' | 'about' | 'footer'

export type WelcomeAnalyticsPage = 'home' | 'browse' | 'about' | 'event' | 'other'

export const OPEN_NEARBY_REQUEST_EVENT = 'puddles:open-nearby-request'

export interface OpenNearbyRequestDetail {
  source: Extract<WelcomeNearbySource, 'about' | 'floating_cta'>
}

function storageAvailable(kind: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const store = window[kind]
    const key = '__puddles_welcome_test__'
    store.setItem(key, '1')
    store.removeItem(key)
    return true
  } catch {
    return false
  }
}

function readFlag(key: string): boolean {
  if (typeof window === 'undefined' || !storageAvailable('localStorage')) return false
  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

function writeFlag(key: string, value: boolean): void {
  if (typeof window === 'undefined' || !storageAvailable('localStorage')) return
  try {
    if (value) window.localStorage.setItem(key, 'true')
    else window.localStorage.removeItem(key)
  } catch {
    // ignore quota / private mode
  }
}

export function isWelcomeSeen(keys: WelcomeStorageKeys = WELCOME_STORAGE_KEYS): boolean {
  return readFlag(keys.seen)
}

export function markWelcomeSeen(keys: WelcomeStorageKeys = WELCOME_STORAGE_KEYS): void {
  writeFlag(keys.seen, true)
}

export function isNeighborhoodSubmitted(
  keys: WelcomeStorageKeys = WELCOME_STORAGE_KEYS,
): boolean {
  return readFlag(keys.submitted)
}

export function markNeighborhoodSubmitted(
  keys: WelcomeStorageKeys = WELCOME_STORAGE_KEYS,
): void {
  writeFlag(keys.submitted, true)
}

export function readCtaDismissedUntil(
  keys: WelcomeStorageKeys = WELCOME_STORAGE_KEYS,
): string | null {
  if (typeof window === 'undefined' || !storageAvailable('localStorage')) return null
  try {
    return window.localStorage.getItem(keys.ctaDismissedUntil)
  } catch {
    return null
  }
}

export function isCtaDismissed(
  keys: WelcomeStorageKeys = WELCOME_STORAGE_KEYS,
  now: Date = new Date(),
): boolean {
  const until = readCtaDismissedUntil(keys)
  if (!until) return false
  const untilMs = Date.parse(until)
  if (Number.isNaN(untilMs)) return false
  return now.getTime() < untilMs
}

export function dismissCtaForDays(
  days = WELCOME_CTA_DISMISS_DAYS,
  keys: WelcomeStorageKeys = WELCOME_STORAGE_KEYS,
  now: Date = new Date(),
): void {
  if (typeof window === 'undefined' || !storageAvailable('localStorage')) return
  try {
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
    window.localStorage.setItem(keys.ctaDismissedUntil, until)
  } catch {
    // ignore
  }
}

export function clearWelcomeStorage(keys: WelcomeStorageKeys = WELCOME_STORAGE_KEYS): void {
  if (typeof window === 'undefined' || !storageAvailable('localStorage')) return
  try {
    window.localStorage.removeItem(keys.seen)
    window.localStorage.removeItem(keys.submitted)
    window.localStorage.removeItem(keys.ctaDismissedUntil)
  } catch {
    // ignore
  }
}

export function isWelcomeAllowedPath(pathname: string): boolean {
  return pathname === '/' || pathname === '/browse' || pathname === '/about'
}

export function isBrowseMapView(pathname: string, search: string): boolean {
  if (pathname === '/map') return true
  if (pathname !== '/browse') return false
  try {
    return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('view') === 'map'
  } catch {
    return false
  }
}

export function isStandaloneEventPath(pathname: string, hasOverlayBackground: boolean): boolean {
  return /^\/event\/[^/]+$/.test(pathname) && !hasOverlayBackground
}

export function welcomeAnalyticsPage(pathname: string): WelcomeAnalyticsPage {
  if (pathname === '/') return 'home'
  if (pathname === '/browse' || pathname === '/map') return 'browse'
  if (pathname === '/about') return 'about'
  if (pathname.startsWith('/event/')) return 'event'
  return 'other'
}

export function shouldAutoShowWelcome({
  welcomeSeen,
  submitted,
  pathname,
  isStandaloneEvent,
  blockingUiOpen,
}: {
  welcomeSeen: boolean
  submitted: boolean
  pathname: string
  isStandaloneEvent: boolean
  blockingUiOpen: boolean
}): boolean {
  if (welcomeSeen || submitted) return false
  if (isStandaloneEvent) return false
  if (!isWelcomeAllowedPath(pathname)) return false
  if (blockingUiOpen) return false
  return true
}

export function shouldShowFloatingCta({
  welcomeSeen,
  submitted,
  ctaDismissed,
  pathname,
  search,
  isStandaloneEvent,
  blockingUiOpen,
  engagementReady,
}: {
  welcomeSeen: boolean
  submitted: boolean
  ctaDismissed: boolean
  pathname: string
  search: string
  isStandaloneEvent: boolean
  blockingUiOpen: boolean
  engagementReady: boolean
}): boolean {
  if (submitted || ctaDismissed) return false
  if (!welcomeSeen) return false
  if (!engagementReady) return false
  if (isStandaloneEvent || pathname.startsWith('/event/')) return false
  if (!isWelcomeAllowedPath(pathname)) return false
  if (isBrowseMapView(pathname, search)) return false
  if (blockingUiOpen) return false
  return true
}

export function isMobileViewport(width = typeof window !== 'undefined' ? window.innerWidth : 1024): boolean {
  return width < 768
}

export function dispatchOpenNearbyRequest(
  source: OpenNearbyRequestDetail['source'] = 'about',
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<OpenNearbyRequestDetail>(OPEN_NEARBY_REQUEST_EVENT, {
      detail: { source },
    }),
  )
}
