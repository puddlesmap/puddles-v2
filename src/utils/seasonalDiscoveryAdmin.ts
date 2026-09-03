import type { DiscoveryCandidate } from '../types/discovery'
import type { Event } from '../types/event'
import { ALL_EVENTS } from '../data/events'
import { LAUNCH_CITIES } from './adminReviewFlags'

function eventToDiscoveryCandidate(event: Event): DiscoveryCandidate {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    startTime: event.startTime || '',
    endTime: event.endTime || '',
    venue: event.venue || '',
    room: event.room || '',
    address: event.address || '',
    city: event.city || '',
    lat: event.lat ?? null,
    lng: event.lng ?? null,
    ageRange: event.ageRange || '',
    ageMin: event.ageMin ?? null,
    ageMax: event.ageMax ?? null,
    audiences: '',
    types: event.types || [],
    categoryTags: event.categoryTags || [],
    cost: event.cost || 'Free',
    description: event.description || '',
    tips: event.tips || '',
    imageUrl: event.imageUrl || '',
    eventUrl: event.eventUrl || '#',
    source: 'Seasonal curation',
    isCancelled: false,
    isRecurring: false,
    alreadyOnPuddles: event.status === 'Published',
    reviewStatus: event.status === 'Published' ? 'live' : 'pending',
    convertedEventId: event.id,
    lastChecked: event.verifiedDate || '',
  }
}

/** Resolve Discovery rows for curated seasonal IDs (candidates first, then Published events). */
export function resolveSeasonalDiscoveryRows(
  eventIds: string[],
  candidates: DiscoveryCandidate[],
): DiscoveryCandidate[] {
  const byId = new Map(candidates.map((row) => [row.id, row]))
  const byConverted = new Map(
    candidates
      .filter((row) => row.convertedEventId)
      .map((row) => [row.convertedEventId, row]),
  )
  const eventsById = new Map(ALL_EVENTS.map((event) => [event.id, event]))

  const rows: DiscoveryCandidate[] = []
  for (const id of eventIds) {
    const fromCandidate = byId.get(id) || byConverted.get(id)
    if (fromCandidate) {
      rows.push(fromCandidate)
      continue
    }
    const fromEvent = eventsById.get(id)
    if (fromEvent) {
      rows.push(eventToDiscoveryCandidate(fromEvent))
    }
  }
  return rows
}

export function isCoreLaunchCity(city: string): boolean {
  return (LAUNCH_CITIES as readonly string[]).includes(String(city || '').trim())
}

/** Regular Discovery: drop non-core Regional rows from default review chips. */
export function filterRegularDiscoveryCandidates(
  candidates: DiscoveryCandidate[],
): DiscoveryCandidate[] {
  return candidates.filter((candidate) => {
    if (isCoreLaunchCity(candidate.city)) return true
    // Keep already-reviewed live/dismissed for Live/Dismissed tabs if city drifted
    if (candidate.reviewStatus === 'live' || candidate.reviewStatus === 'dismissed') return true
    return false
  })
}
