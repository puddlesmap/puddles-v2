export type SeasonalReturnTarget = {
  to: string
  label: string
}

export const SEASONAL_RETURN_STATE_KEY = 'seasonalReturn' as const
const STORAGE_KEY = 'puddles.seasonalReturn.v1'

type SeasonalReturnState = {
  [SEASONAL_RETURN_STATE_KEY]?: SeasonalReturnTarget
}

const FALLBACK: SeasonalReturnTarget = { to: '/guides', label: 'Guides' }

function labelForPath(pathname: string): string {
  if (pathname === '/') return 'Home'
  if (pathname === '/guides' || pathname.startsWith('/guides/')) return 'Guides'
  if (pathname === '/browse') return 'Browse'
  if (pathname === '/about') return 'About'
  if (pathname === '/saved') return 'Saved'
  if (pathname.startsWith('/seasonal/')) return 'Seasonal'
  return 'Puddles'
}

function normalizePath(pathname: string): string {
  if (!pathname) return '/'
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

function readStoredReturn(): SeasonalReturnTarget | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SeasonalReturnTarget
    if (parsed?.to && parsed?.label) return parsed
  } catch {
    return null
  }
  return null
}

/** Persist return target — needed because MemoryRouter remounts wipe location.state. */
export function stashSeasonalReturn(to: string, label: string): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ to, label }))
  } catch {
    // ignore quota / private mode
  }
}

/** Location state to pass when linking into a seasonal hub from Home / Guides. */
export function seasonalReturnLinkState(to: string, label: string): SeasonalReturnState {
  stashSeasonalReturn(to, label)
  return { [SEASONAL_RETURN_STATE_KEY]: { to, label } }
}

/**
 * Resolve where Seasonal Hub Back should go.
 * Prefer router state, then session stash, then same-origin referrer allowlist; else Guides.
 * Never uses blind history.back() (avoids external / unrelated pages).
 */
export function resolveSeasonalReturnTarget(
  locationState: unknown,
  referrer = typeof document !== 'undefined' ? document.referrer : '',
  currentOrigin = typeof window !== 'undefined' ? window.location.origin : '',
  currentPath = typeof window !== 'undefined' ? window.location.pathname : '',
): SeasonalReturnTarget {
  const fromState = (locationState as SeasonalReturnState | null)?.[SEASONAL_RETURN_STATE_KEY]
  if (fromState?.to && fromState.label) {
    stashSeasonalReturn(fromState.to, fromState.label)
    return { to: fromState.to, label: fromState.label }
  }

  const stored = readStoredReturn()
  if (stored) return stored

  if (!referrer || !currentOrigin) return FALLBACK

  try {
    const ref = new URL(referrer)
    if (ref.origin !== currentOrigin) return FALLBACK
    const path = normalizePath(ref.pathname)
    const here = normalizePath(currentPath)
    if (path === here) return FALLBACK
    if (
      path === '/' ||
      path === '/guides' ||
      path === '/browse' ||
      path === '/about' ||
      path === '/saved' ||
      path === '/map' ||
      path === '/share' ||
      path.startsWith('/guides/') ||
      path.startsWith('/seasonal/') ||
      path.startsWith('/event/') ||
      path.startsWith('/palo-alto') ||
      path.startsWith('/los-altos') ||
      path.startsWith('/mountain-view') ||
      path.startsWith('/sunnyvale')
    ) {
      return { to: path, label: labelForPath(path) }
    }
  } catch {
    return FALLBACK
  }

  return FALLBACK
}
