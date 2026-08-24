import { ALL_EVENTS } from '../data/events'
import { ALL_DISCOVERY_CANDIDATES } from '../data/discovery'
import { SYNC_META } from '../data/syncInfo'
import type { DiscoveryCandidate, DiscoveryEditableFields } from '../types/discovery'
import type { ActivityType, City, Event } from '../types/event'
import { ACTIVITY_TYPES } from '../types/event'
import { resolveEventCost } from './eventCost'
import { enrichPublishingFields } from './publishing'
import { findMatchingEventIdsForCandidate } from './discoveryMatchEvents'
import { inferAgeRangeFromText } from './discoveryAgeHints'
import {
  findOutsidePuddlesAgeScope,
} from './eventAudienceAge'
import {
  applyDiscoveryReviewOverrides,
  editableFieldsFromCandidate,
  loadDiscoveryReviewStore,
} from './discoveryReview'
import {
  loadCachedAdminRefresh,
  resolveAdminEventsSource,
  saveCachedAdminRefresh,
} from './sheetSync'

export const OUTSIDE_PUDDLES_AGE_MESSAGE = 'Outside Puddles ages 0–5 — cannot approve.'

/** Merge candidate + edits (and fresh copy inference) then block out-of-scope ages. */
export function assertDiscoveryAgeInScope(
  candidate: DiscoveryCandidate,
  edits: Partial<DiscoveryEditableFields> = {},
): void {
  const title = edits.title ?? candidate.title
  const description = edits.description ?? candidate.description
  const tips = edits.tips ?? candidate.tips
  const inferred = inferAgeRangeFromText([description, tips, title].filter(Boolean).join('\n'))
  const scope = findOutsidePuddlesAgeScope({
    ageRange: edits.ageRange ?? candidate.ageRange,
    ageMin: inferred?.ageMin ?? candidate.ageMin,
    ageMax: inferred?.ageMax ?? candidate.ageMax,
    title,
    description,
    tips,
  })
  if (scope) {
    throw new Error(scope.note || OUTSIDE_PUDDLES_AGE_MESSAGE)
  }
}

function slugPart(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function localDraftId(candidate: DiscoveryCandidate, edits: DiscoveryEditableFields): string {
  if (candidate.convertedEventId?.trim()) return candidate.convertedEventId.trim()
  const fromParts = [
    'disc',
    slugPart(edits.title || candidate.title),
    slugPart(edits.date || candidate.date),
    slugPart(candidate.id),
  ]
    .filter(Boolean)
    .join('-')
  return fromParts.slice(0, 100) || `disc-${candidate.id}`
}

function asCity(raw: string): City {
  const cities: City[] = ['Palo Alto', 'Los Altos', 'Mountain View']
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

function currentAdminEvents(): Event[] {
  return resolveAdminEventsSource(ALL_EVENTS, SYNC_META.syncedAt).events
}

function persistAdminEvents(events: Event[]) {
  saveCachedAdminRefresh({
    events,
    refreshedAt: new Date().toISOString(),
  })
}

/** Stamp verifiedDate on matching Events in the Admin browser cache. */
export function applyVerifiedDateInAdminCache(
  candidate: DiscoveryCandidate,
  edits: DiscoveryEditableFields,
  verifiedDate: string,
): { eventId: string; updatedIds: string[] } {
  const matchedIds = findMatchingEventIdsForCandidate({
    ...candidate,
    ...edits,
  })

  let events = currentAdminEvents()
  let updatedIds = matchedIds.filter((id) => events.some((event) => event.id === id))

  if (updatedIds.length === 0) {
    const targetUrl = String(edits.eventUrl || candidate.eventUrl || '')
      .trim()
      .replace(/\/$/, '')
      .toLowerCase()
    const targetDate = edits.date || candidate.date
    updatedIds = events
      .filter((event) => {
        const url = String(event.eventUrl || '')
          .trim()
          .replace(/\/$/, '')
          .toLowerCase()
        if (!targetUrl || url !== targetUrl) return false
        if (targetDate && event.date !== targetDate) return false
        return true
      })
      .map((event) => event.id)
  }

  if (updatedIds.length === 0) {
    throw new Error(
      'Could not find the matching Events row in Admin. Open Events once (or Refresh from Sheet), then try Approve again.',
    )
  }

  const idSet = new Set(updatedIds)
  events = events.map((event) =>
    idSet.has(event.id) ? enrichPublishingFields({ ...event, verifiedDate }) : event,
  )
  persistAdminEvents(events)
  return { eventId: updatedIds[0], updatedIds }
}

/** Add a local Draft into the Admin Events cache (no Sheet write). */
export function appendDraftInAdminCache(
  candidate: DiscoveryCandidate,
  edits: DiscoveryEditableFields,
  verifiedDate: string,
): { eventId: string } {
  assertDiscoveryAgeInScope(candidate, edits)
  const eventId = localDraftId(candidate, edits)
  let events = currentAdminEvents()

  const existingIndex = events.findIndex((event) => event.id === eventId)
  const inferred = inferAgeRangeFromText(
    [edits.description || candidate.description, edits.tips || candidate.tips, edits.title || candidate.title]
      .filter(Boolean)
      .join('\n'),
  )
  const ageMin = inferred?.ageMin ?? candidate.ageMin ?? 0
  const ageMax = inferred?.ageMax ?? candidate.ageMax ?? 5
  const draft = enrichPublishingFields({
    id: eventId,
    title: edits.title || candidate.title,
    description: edits.description || candidate.description || '',
    ...(edits.tips || candidate.tips ? { tips: edits.tips || candidate.tips } : {}),
    venue: edits.venue || candidate.venue,
    ...(edits.room || candidate.room ? { room: edits.room || candidate.room } : {}),
    address: edits.address || candidate.address || '',
    city: asCity(edits.city || candidate.city),
    date: edits.date || candidate.date,
    startTime: edits.startTime || candidate.startTime || '',
    endTime: edits.endTime || candidate.endTime || '',
    ageRange: edits.ageRange || inferred?.ageRange || candidate.ageRange || '0–2, 2–5, 5+',
    ageMin,
    ageMax,
    types: asActivityTypes(edits.types?.length ? edits.types : candidate.types),
    categoryTags: candidate.categoryTags || [],
    cost: resolveEventCost(
      edits.cost || candidate.cost,
      edits.description || candidate.description,
      edits.tips || candidate.tips,
    ),
    imageUrl: edits.imageUrl || candidate.imageUrl || '',
    eventUrl: edits.eventUrl || candidate.eventUrl || '#',
    verifiedDate,
    lat: candidate.lat ?? 0,
    lng: candidate.lng ?? 0,
    status: 'Draft',
  })

  if (existingIndex >= 0) {
    events = events.map((event, index) => (index === existingIndex ? draft : event))
  } else {
    events = [...events, draft].sort(
      (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    )
  }

  persistAdminEvents(events)
  return { eventId }
}

/**
 * Local-first Discovery Approve: Ready in Discovery review store is separate;
 * this updates Admin Events cache so Drafts / verified dates show under Events.
 */
export function approveDiscoveryLocally(
  candidate: DiscoveryCandidate,
  edits: DiscoveryEditableFields,
  verifiedDate: string,
): { eventId: string; mode: 'existing' | 'draft' } {
  assertDiscoveryAgeInScope(candidate, edits)
  if (candidate.alreadyOnPuddles) {
    const result = applyVerifiedDateInAdminCache(candidate, edits, verifiedDate)
    return { eventId: result.eventId, mode: 'existing' }
  }
  const result = appendDraftInAdminCache(candidate, edits, verifiedDate)
  return { eventId: result.eventId, mode: 'draft' }
}

const WRITE_SHEET_KEY = 'puddles-admin-discovery-write-sheet-v1'

export function loadWriteSheetPreference(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(WRITE_SHEET_KEY) === '1'
  } catch {
    return false
  }
}

export function saveWriteSheetPreference(enabled: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(WRITE_SHEET_KEY, enabled ? '1' : '0')
  } catch {
    // ignore
  }
}

/** Ensure Admin Events cache exists so local Drafts/patches are not lost on next resolve. */
export function ensureAdminEventsCacheSeeded() {
  if (loadCachedAdminRefresh()?.events?.length) return
  const resolved = resolveAdminEventsSource(ALL_EVENTS, SYNC_META.syncedAt)
  persistAdminEvents(resolved.events)
}

/**
 * Pull Discovery Ready items into the Admin Events cache.
 * Fixes cases where Ready was stamped but Drafts never appeared (older Approve path,
 * cache cleared, or Events opened before Approve finished writing).
 */
export function syncReadyDiscoveryIntoAdminCache(): {
  events: Event[]
  draftsAdded: number
  verifiedUpdated: number
} {
  ensureAdminEventsCacheSeeded()
  const store = loadDiscoveryReviewStore()
  const candidates = applyDiscoveryReviewOverrides(ALL_DISCOVERY_CANDIDATES, store)
  const ready = candidates.filter((candidate) => candidate.reviewStatus === 'approved')

  let draftsAdded = 0
  let verifiedUpdated = 0

  for (const candidate of ready) {
    const edits = editableFieldsFromCandidate(candidate)
    const verifiedDate = (candidate.lastChecked || edits.lastChecked || '').trim()
    if (!verifiedDate) continue

    if (candidate.alreadyOnPuddles) {
      const matchedIds = findMatchingEventIdsForCandidate({ ...candidate, ...edits })
      if (matchedIds.length === 0) continue
      const events = currentAdminEvents()
      const needsUpdate = matchedIds.some((id) => {
        const row = events.find((event) => event.id === id)
        return row && row.verifiedDate !== verifiedDate
      })
      if (!needsUpdate) continue
      try {
        applyVerifiedDateInAdminCache(candidate, edits, verifiedDate)
        verifiedUpdated += 1
      } catch {
        // Matching row missing in this browser — skip.
      }
      continue
    }

    const events = currentAdminEvents()
    const draftId = localDraftId(candidate, edits)
    const urlKey = String(edits.eventUrl || candidate.eventUrl || '')
      .trim()
      .replace(/\/$/, '')
      .toLowerCase()
    const targetDate = edits.date || candidate.date
    const alreadyPresent =
      events.some((event) => event.id === draftId) ||
      (Boolean(candidate.convertedEventId) &&
        events.some((event) => event.id === candidate.convertedEventId)) ||
      (Boolean(urlKey) &&
        urlKey !== '#' &&
        events.some(
          (event) =>
            String(event.eventUrl || '')
              .trim()
              .replace(/\/$/, '')
              .toLowerCase() === urlKey && event.date === targetDate,
        ))

    if (alreadyPresent) continue

    appendDraftInAdminCache(candidate, edits, verifiedDate)
    draftsAdded += 1
  }

  return {
    events: currentAdminEvents(),
    draftsAdded,
    verifiedUpdated,
  }
}

/**
 * Prepare Ready Discovery candidates for Go live: ensure Admin cache rows exist,
 * set Status = Published, return the Event payloads to commit to the public catalog.
 */
export function prepareGoLiveEvents(
  candidates: DiscoveryCandidate[],
  verifiedDate: string,
): { events: Event[]; results: Array<{ candidateId: string; eventId: string }> } {
  ensureAdminEventsCacheSeeded()
  const results: Array<{ candidateId: string; eventId: string }> = []
  const publishIds = new Set<string>()

  for (const candidate of candidates) {
    const edits = editableFieldsFromCandidate(candidate)
    const stamped = { ...edits, lastChecked: verifiedDate }

    let eventId = ''
    if (candidate.alreadyOnPuddles) {
      try {
        const result = applyVerifiedDateInAdminCache(candidate, stamped, verifiedDate)
        eventId = result.eventId
      } catch {
        const draft = appendDraftInAdminCache(candidate, stamped, verifiedDate)
        eventId = draft.eventId
      }
    } else {
      const draft = appendDraftInAdminCache(candidate, stamped, verifiedDate)
      eventId = draft.eventId
    }

    publishIds.add(eventId)
    results.push({ candidateId: candidate.id, eventId })
  }

  let events = currentAdminEvents().map((event) => {
    if (!publishIds.has(event.id)) return event
    return enrichPublishingFields({
      ...event,
      status: 'Published',
      verifiedDate,
    })
  })
  persistAdminEvents(events)

  const toPublish = events.filter((event) => publishIds.has(event.id))
  return { events: toPublish, results }
}
