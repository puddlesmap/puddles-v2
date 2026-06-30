import type { DayFilter } from '../types/event'

export function getBrowseEventNoun(eventCount: number, day: DayFilter = 'anytime'): string {
  const upcoming = day === 'anytime'
  if (eventCount === 1) return upcoming ? 'upcoming event' : 'event'
  return upcoming ? 'upcoming events' : 'events'
}

export function getBrowseResultsSummary(
  eventCount: number,
  city: string,
  day: DayFilter = 'anytime',
): string {
  const location = city === 'nearby' ? 'you' : city === 'all' ? 'all cities' : city
  const noun = getBrowseEventNoun(eventCount, day)
  return `${eventCount} ${noun} near ${location}`
}
