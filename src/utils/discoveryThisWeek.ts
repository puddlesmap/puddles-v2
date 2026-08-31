import { ACTIVITY_TYPE_FILTER_NEW_UNTIL } from '../config/activityTypeLaunch'
import { CITY_FILTER_NEW_UNTIL } from '../config/cityLaunch'
import type { ActivityType, City } from '../types/event'
import type { DiscoveryCandidate } from '../types/discovery'
import { pacificTodayYmd } from './discoveryReview'

const PARENT_AND_ME = 'Parent & Me' as const

function shiftYmd(ymd: string, deltaDays: number): string {
  const [year, month, day] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + deltaDays)
  return date.toISOString().slice(0, 10)
}

/** Pacific calendar start for the rolling discovery week (default: last 7 days incl. today). */
export function getDiscoveryWeekStart(days = 7): string {
  const today = pacificTodayYmd()
  return shiftYmd(today, -(days - 1))
}

const LIBRARY_SOURCES = new Set([
  'Palo Alto Library · BiblioCommons',
  'SCCL · Los Altos',
  'Mountain View Library · LibCal',
])

function effectiveDiscoveryAddedYmd(
  candidate: DiscoveryCandidate,
  catalogGeneratedAt?: string,
): string {
  const checked = candidate.lastChecked?.trim()
  if (checked) return checked

  if (LIBRARY_SOURCES.has(candidate.source) && catalogGeneratedAt) {
    return catalogGeneratedAt.slice(0, 10)
  }

  const watchlistMatch = candidate.id.match(/-(\d{4}-\d{2}-\d{2})$/)
  if (watchlistMatch) return watchlistMatch[1]

  return ''
}

export function isDiscoveryNewThisWeek(
  candidate: DiscoveryCandidate,
  weekStart = getDiscoveryWeekStart(),
  catalogGeneratedAt?: string,
): boolean {
  if (candidate.reviewStatus !== 'pending') return false
  if (candidate.alreadyOnPuddles) return false

  const added = effectiveDiscoveryAddedYmd(candidate, catalogGeneratedAt)
  if (!added || added < weekStart) return false

  return true
}

function countByKey(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    const key = value.trim()
    if (!key) return acc
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}

function hasParentAndMe(candidate: DiscoveryCandidate): boolean {
  if (candidate.types?.includes(PARENT_AND_ME)) return true
  return candidate.categoryTags?.some((tag) => tag.includes(PARENT_AND_ME)) ?? false
}

function hasLaunchActivityType(candidate: DiscoveryCandidate, type: ActivityType): boolean {
  return candidate.types?.includes(type) ?? false
}

export interface DiscoveryThisWeekSummary {
  weekStart: string
  weekEnd: string
  total: number
  sunnyvaleCount: number
  parentAndMeCount: number
  launchCities: Array<{ city: City; count: number; newUntil: string }>
  launchActivityTypes: Array<{ type: ActivityType; count: number; newUntil: string }>
  bySource: Array<{ source: string; count: number }>
  byCity: Array<{ city: string; count: number }>
  highlights: string[]
}

export function summarizeDiscoveryThisWeek(
  candidates: DiscoveryCandidate[],
  weekStart = getDiscoveryWeekStart(),
  catalogGeneratedAt?: string,
): DiscoveryThisWeekSummary {
  const weekEnd = pacificTodayYmd()
  const rows = candidates.filter((candidate) =>
    isDiscoveryNewThisWeek(candidate, weekStart, catalogGeneratedAt),
  )

  const launchCities = (Object.entries(CITY_FILTER_NEW_UNTIL) as Array<[City, string]>).map(
    ([city, newUntil]) => ({
      city,
      count: rows.filter((row) => row.city === city).length,
      newUntil,
    }),
  )

  const launchActivityTypes = (
    Object.entries(ACTIVITY_TYPE_FILTER_NEW_UNTIL) as Array<[ActivityType, string]>
  ).map(([type, newUntil]) => ({
    type,
    count: rows.filter((row) => hasLaunchActivityType(row, type)).length,
    newUntil,
  }))

  const bySource = Object.entries(countByKey(rows.map((row) => row.source)))
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)

  const byCity = Object.entries(countByKey(rows.map((row) => row.city)))
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)

  const sunnyvaleCount = rows.filter((row) => row.city === 'Sunnyvale').length
  const parentAndMeCount = rows.filter(hasParentAndMe).length

  const highlights: string[] = []
  if (sunnyvaleCount > 0) {
    highlights.push(`${sunnyvaleCount} in Sunnyvale (new city filter)`)
  }
  if (parentAndMeCount > 0) {
    highlights.push(`${parentAndMeCount} Parent & Me (new activity type)`)
  }
  const festivalsCount =
    launchActivityTypes.find((entry) => entry.type === 'Festivals & Community')?.count ?? 0
  if (festivalsCount > 0) {
    highlights.push(`${festivalsCount} Festivals & Community`)
  }

  return {
    weekStart,
    weekEnd,
    total: rows.length,
    sunnyvaleCount,
    parentAndMeCount,
    launchCities,
    launchActivityTypes,
    bySource,
    byCity,
    highlights,
  }
}
