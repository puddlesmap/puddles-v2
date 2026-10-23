import { citySlugForCity } from '../config/localRoutes'
import type { ActivityType, City } from '../types/event'
import type { AgeFilter } from './ageRange'

export function isBrowseSharePath(pathname: string): boolean {
  return pathname === '/browse' || pathname === '/browse-v2'
}

/** City, one activity, one age, and map view. Other filters stay in memory. */
export function browseShareParams(input: {
  pathname: string
  city: string
  age: AgeFilter
  types: ActivityType[]
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

  if (input.viewMode === 'map') next.set('view', 'map')
  else next.delete('view')

  return next
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
