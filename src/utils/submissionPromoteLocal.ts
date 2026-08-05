import type { SheetSubmission } from '../types/submission'
import type { ActivityType, City, Event } from '../types/event'
import { ACTIVITY_TYPES } from '../types/event'
import { resolveEventCost } from './eventCost'
import { enrichPublishingFields } from './publishing'
import { pacificTodayYmd } from './discoveryReview'
import {
  loadCachedAdminRefresh,
  resolveAdminEventsSource,
  saveCachedAdminRefresh,
} from './sheetSync'
import { ALL_EVENTS } from '../data/events'
import { SYNC_META } from '../data/syncInfo'

function slugPart(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function submissionEventId(submission: SheetSubmission): string {
  if (submission.convertedEventId?.trim()) return submission.convertedEventId.trim()
  return (
    ['sub', slugPart(submission.eventName), slugPart(submission.date), slugPart(submission.id)]
      .filter(Boolean)
      .join('-')
      .slice(0, 100) || `sub-${submission.id}`
  )
}

function asCity(raw: string): City {
  const cities: City[] = ['Palo Alto', 'Los Altos', 'Mountain View']
  const hit = cities.find((city) => city.toLowerCase() === raw.trim().toLowerCase())
  return hit ?? ((raw.trim() || 'Palo Alto') as City)
}

function asActivityTypes(raw: string): ActivityType[] {
  const parts = String(raw || '')
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter(Boolean)
  const matched = parts
    .map((value) => ACTIVITY_TYPES.find((type) => type.toLowerCase() === value.toLowerCase()))
    .filter((value): value is ActivityType => Boolean(value))
  return matched.length > 0 ? matched : ['Other']
}

function buildPromotedDescription(submission: SheetSubmission): string {
  const parts: string[] = []
  if (submission.eventDescription) parts.push(submission.eventDescription)
  if (submission.parentTips) parts.push(`Parent tips: ${submission.parentTips}`)
  const signup = [submission.signupRequirement, submission.signupLinkInfo].filter(Boolean).join(' — ')
  if (signup) parts.push(`Sign-up: ${signup}`)
  return parts.join('\n\n').slice(0, 500)
}

function currentAdminEvents(): Event[] {
  return resolveAdminEventsSource(ALL_EVENTS, SYNC_META.syncedAt).events
}

function persistAdminEvents(events: Event[]) {
  saveCachedAdminRefresh({
    events,
    refreshedAt: new Date().toISOString(),
  })
}

/** Ensure Admin Events cache exists before promoting. */
export function ensureAdminEventsCacheForSubmissions() {
  if (loadCachedAdminRefresh()?.events?.length) return
  const resolved = resolveAdminEventsSource(ALL_EVENTS, SYNC_META.syncedAt)
  persistAdminEvents(resolved.events)
}

/**
 * Promote an Approved Event submission into the Admin Events cache as Published-ready,
 * and return the Event for Go live.
 */
export function promoteSubmissionLocally(
  submission: SheetSubmission,
  verifiedDate: string = pacificTodayYmd(),
): { event: Event; eventId: string } {
  if (String(submission.submissionType || '').toLowerCase() !== 'event') {
    throw new Error('Only Event submissions can go live on Puddles.')
  }
  if (String(submission.status || '').toLowerCase() !== 'approved') {
    throw new Error('Submission must be Approved before Go live.')
  }

  ensureAdminEventsCacheForSubmissions()
  const eventId = submissionEventId(submission)
  let events = currentAdminEvents()
  const description = buildPromotedDescription(submission)
  const tips = submission.parentTips || ''

  const event = enrichPublishingFields({
    id: eventId,
    title: submission.eventName || 'Untitled activity',
    description,
    ...(tips ? { tips } : {}),
    venue: submission.locationName || submission.address || '',
    address: submission.address || submission.locationName || '',
    city: asCity(submission.city),
    date: submission.date || verifiedDate,
    startTime: submission.startTime || '',
    endTime: submission.endTime || submission.startTime || '',
    ageRange: submission.ageRange || '0–2, 2–5, 5+',
    ageMin: 0,
    ageMax: 5,
    types: asActivityTypes(submission.types || submission.eventType),
    categoryTags: [],
    cost: resolveEventCost(submission.cost || submission.costType, description, tips),
    imageUrl: '',
    eventUrl: submission.link || '#',
    verifiedDate,
    lat: 0,
    lng: 0,
    status: 'Published',
  })

  const existingIndex = events.findIndex((row) => row.id === eventId)
  if (existingIndex >= 0) {
    events = events.map((row, index) => (index === existingIndex ? event : row))
  } else {
    events = [...events, event].sort(
      (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    )
  }
  persistAdminEvents(events)
  return { event, eventId }
}
