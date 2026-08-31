import type { City } from '../types/event'

/**
 * Last calendar day (inclusive, local) to show NEW on city filter chips.
 */
export const CITY_FILTER_NEW_UNTIL: Partial<Record<City, string>> = {
  Sunnyvale: '2026-10-31',
}

export function isNewCityFilter(city: City | 'all', now = new Date()): boolean {
  if (city === 'all') return false

  const until = CITY_FILTER_NEW_UNTIL[city]
  if (!until) return false

  const end = new Date(`${until}T23:59:59`)
  return now.getTime() <= end.getTime()
}
