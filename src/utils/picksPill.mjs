/** Shared rules for the one Puddles Picks floating pill. */

export const PICKS_PILL_DISMISS_DAYS = 30

/** @typedef {'home' | 'browse' | 'seasonal' | 'guide'} PicksPillPage */

/**
 * @param {string} pathname
 * @returns {PicksPillPage | null}
 */
export function picksPillPage(pathname) {
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/'
  if (path === '/') return 'home'
  if (path === '/browse' || path === '/map') return 'browse'
  if (path === '/seasonal' || path.startsWith('/seasonal/')) return 'seasonal'
  if (path === '/guides' || path.startsWith('/guides/')) return 'guide'
  return null
}

/** @param {PicksPillPage} page */
export function picksPillSignupSource(page) {
  return `puddles_picks_pill_${page}`
}

/**
 * @param {string | null | undefined} until
 * @param {number} [now]
 */
export function isPicksPillDismissed(until, now = Date.now()) {
  if (!until) return false
  const untilMs = Date.parse(until)
  if (Number.isNaN(untilMs)) return false
  return now < untilMs
}

/**
 * @param {number} [now]
 * @param {number} [days]
 */
export function picksPillDismissUntil(now = Date.now(), days = PICKS_PILL_DISMISS_DAYS) {
  return new Date(now + days * 24 * 60 * 60 * 1000).toISOString()
}
