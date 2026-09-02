import { ALL_DISCOVERY_CANDIDATES } from '../data/discovery'
import type { DiscoveryCandidate } from '../types/discovery'
import type { ActivityType, City, Event } from '../types/event'
import { ACTIVITY_TYPES } from '../types/event'
import { isLibraryClosureNotice } from '../utils/discoveryClosureNotices'
import { resolveEventCost } from './eventCost'
import { enrichPublishingFields } from './publishing'

function asCity(raw: string): City {
  const cities: City[] = [
    'Palo Alto',
    'Los Altos',
    'Mountain View',
    'Sunnyvale',
    'Cupertino',
    'Redwood City',
    'Menlo Park',
    'San Jose',
    'Fremont',
    'San Francisco',
  ]
  const hit = cities.find((city) => city.toLowerCase() === raw.trim().toLowerCase())
  return hit ?? ((raw.trim() || 'Palo Alto') as City)
}

function asActivityTypes(raw: string[]): ActivityType[] {
  const matched = raw
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .map((value) => ACTIVITY_TYPES.find((type) => type.toLowerCase() === value.toLowerCase()))
    .filter((value): value is ActivityType => Boolean(value))
  return matched.length > 0 ? matched : ['Other']
}

/** Convert a pending discovery row into a Hidden event for localhost launch review + /event/:id preview. */
export function discoveryCandidateToReviewEvent(candidate: DiscoveryCandidate): Event {
  return enrichPublishingFields({
    id: candidate.id,
    title: candidate.title,
    description: candidate.description || '',
    ...(candidate.tips ? { tips: candidate.tips } : {}),
    venue: candidate.venue,
    ...(candidate.room ? { room: candidate.room } : {}),
    address: candidate.address || '',
    city: asCity(candidate.city),
    date: candidate.date,
    startTime: candidate.startTime || '',
    endTime: candidate.endTime || '',
    ageRange: candidate.ageRange || '0–2, 2–5, 5+',
    ageMin: candidate.ageMin ?? 0,
    ageMax: candidate.ageMax ?? 5,
    types: asActivityTypes(candidate.types),
    categoryTags: [
      ...(candidate.categoryTags || []),
      `Discovery · ${candidate.source}`,
    ],
    cost: resolveEventCost(candidate.cost, candidate.description, candidate.tips),
    imageUrl: candidate.imageUrl || '',
    eventUrl: candidate.eventUrl || '#',
    verifiedDate: candidate.lastChecked || '',
    lat: candidate.lat ?? 0,
    lng: candidate.lng ?? 0,
    status: 'Hidden',
    isLive: false,
  })
}

/** Discovery queue rows not yet on the live catalog — for launch review. */
export function getUnaddedDiscoveryReviewEvents(): Event[] {
  return ALL_DISCOVERY_CANDIDATES.filter(
    (candidate) =>
      candidate.reviewStatus === 'pending' &&
      !candidate.alreadyOnPuddles &&
      !isLibraryClosureNotice(candidate),
  ).map(discoveryCandidateToReviewEvent)
}
