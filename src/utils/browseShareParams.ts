import { citySlugForCity } from '../config/localRoutes'
import type { ActivityType, City } from '../types/event'
import type { AgeFilter } from './ageRange'

export function isBrowseSharePath(pathname: string): boolean {
  return pathname === '/browse' || pathname === '/browse-v2'
}

/** True when Browse should treat `seasonal` query as on. */
export function seasonalParamEnabled(value: string | null): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

/** City, one activity, one age, seasonal chip, and map view. Other filters stay in memory. */
export function browseShareParams(input: {
  pathname: string
  city: string
  age: AgeFilter
  types: ActivityType[]
  seasonal?: boolean
  viewMode: 'list' | 'map'
  current: URLSearchParams
}): URLSearchParams {
  const next = new URLSearchParams(input.current.toString())
  if (!isBrowseSharePath(input.pathname)) return next

  const slug =
    input.city !== 'all' && input.city !== 'nearby' ? citySlugForCity(input.city as City) : null
  if (slug) next.set('city', slug)
  else next.delete('city')

  if (input.types.length === 1) next.set('activity', input.types[0])
  else next.delete('activity')

  if (input.age !== 'all') next.set('age', input.age)
  else next.delete('age')

  if (input.seasonal) next.set('seasonal', '1')
  else next.delete('seasonal')

  if (input.viewMode === 'map') next.set('view', 'map')
  else next.delete('view')

  return next
}

/** Deep link that opens Browse with the Seasonal chip on (Holiday collection inventory). */
export function holidayBrowseAllHref(options?: { city?: string | null }): string {
  const params = new URLSearchParams()
  params.set('seasonal', '1')
  const city = options?.city?.trim()
  if (city && city !== 'all' && city !== 'nearby') {
    const slug = citySlugForCity(city as City)
    if (slug) params.set('city', slug)
  }
  return `/browse?${params.toString()}`
}

export function searchParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  const keys = new Set([...a.keys(), ...b.keys()])
  for (const key of keys) {
    const left = a.getAll(key).slice().sort().join('\n')
    const right = b.getAll(key).slice().sort().join('\n')
    if (left !== right) return false
  }
  return true
}
