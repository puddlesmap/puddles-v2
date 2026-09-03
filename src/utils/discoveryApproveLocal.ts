import { ALL_EVENTS } from '../data/events'
import { ALL_DISCOVERY_CANDIDATES } from '../data/discovery'
import { SYNC_META } from '../data/syncInfo'
import type { DiscoveryCandidate, DiscoveryEditableFields } from '../types/discovery'
import type { ActivityType, City, Event } from '../types/event'
import { ACTIVITY_TYPES } from '../types/event'
import { resolveEventCost } from './eventCost'
import { enrichPublishingFields } from './publishing'
import {
  findMatchingEventIdsForCandidate,
  findMatchingEventsForCandidate,
  normalizeDiscoveryEventUrl,
} from './discoveryMatchEvents'
import { inferAgeRangeFromText } from './discoveryAgeHints'
import {
  findOutsidePuddlesAgeScope,
} from './eventAudienceAge'
import {
  applyDiscoveryReviewOverrides,
  editableFieldsFromCandidate,
  loadDiscoveryReviewStore,
  saveDiscoveryReviewRecord,
} from './discoveryReview'
import {
  loadCachedAdminRefresh,
  resolveAdminEventsSource,
  saveCachedAdminRefresh,
} from './sheetSync'
import { LAUNCH_CITIES } from './adminReviewFlags'

export const OUTSIDE_PUDDLES_AGE_MESSAGE = 'Outside Puddles ages 0–5 — cannot approve.'

export const OUTSIDE_CORE_CITY_MESSAGE =
  'Outside Puddles core cities (Palo Alto · Los Altos · Mountain View · Sunnyvale). Do not Go live into regular Browse — use Seasonal Discovery / Worth a little drive only.'

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

/** Block Go live / Approve into the public catalog for out-of-area Regional rows. */
export function assertDiscoveryCityInScope(
  candidate: DiscoveryCandidate,
  edits: Partial<DiscoveryEditableFields> = {},
): void {
  const city = String(edits.city ?? candidate.city ?? '').trim()
  if (!(LAUNCH_CITIES as readonly string[]).includes(city)) {
    throw new Error(OUTSIDE_CORE_CITY_MESSAGE)
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
  const cities: City[] = ['Palo Alto', 'Los Altos', 'Mountain View', 'Sunnyvale']
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

const TITLE_STOP_WORDS = new Set([
  'the',
  'and',
  'with',
  'for',
  'a',
  'an',
  'at',
  'of',
  'to',
  'in',
  'on',
  'family',
  'english',
  'main',
])

function titleTokens(title: string): Set<string> {
  return new Set(
    String(title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
      .split(/\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 2 && !TITLE_STOP_WORDS.has(part)),
  )
}

function titlesLikelySameOuting(a: string, b: string): boolean {
  const left = titleTokens(a)
  const right = titleTokens(b)
  if (left.size === 0 || right.size === 0) return false
  let overlap = 0
  for (const token of left) {
    if (right.has(token)) overlap += 1
  }
  if (overlap >= 2) return true
  if (overlap >= 1 && (left.size <= 2 || right.size <= 2)) return true
  return false
}

/** Published catalog row that duplicates a Draft (URL+date, else title+date+city). */
export function findLiveDuplicateForDraft(
  draft: Pick<Event, 'id' | 'title' | 'date' | 'city' | 'eventUrl'>,
  pool: Event[] = currentAdminEvents(),
): Event | null {
  const published = pool.filter((event) => event.status === 'Published' && event.id !== draft.id)
  const draftUrl = normalizeDiscoveryEventUrl(draft.eventUrl)
  if (draftUrl && draftUrl !== '#') {
    const byUrlDate = published.find(
      (event) =>
        normalizeDiscoveryEventUrl(event.eventUrl) === draftUrl && event.date === draft.date,
    )
    if (byUrlDate) return byUrlDate
  }

  return (
    published.find(
      (event) =>
        event.date === draft.date &&
        event.city === draft.city &&
        titlesLikelySameOuting(event.title, draft.title),
    ) || null
  )
}

/**
 * Reconcile Admin browser state with the Published/Live catalog:
 * drop Draft twins, promote Ready/Pending matches to Live, refresh verified dates.
 */
export function reconcileAdminWithLivedCatalog(): {
  events: Event[]
  draftsRemoved: number
  readyPromoted: number
  pendingPromoted: number
} {
  ensureAdminEventsCacheSeeded()
  const before = currentAdminEvents()
  const removeIds = new Set<string>()

  for (const event of before) {
    if (event.status !== 'Draft') continue
    const live = findLiveDuplicateForDraft(event, before)
    if (!live) continue
    removeIds.add(event.id)
  }

  let events = before
  if (removeIds.size > 0) {
    events = before.filter((event) => !removeIds.has(event.id))
    persistAdminEvents(events)
  }

  const store = loadDiscoveryReviewStore()
  const candidates = applyDiscoveryReviewOverrides(ALL_DISCOVERY_CANDIDATES, store)
  let readyPromoted = 0
  let pendingPromoted = 0

  for (const candidate of candidates) {
    if (candidate.reviewStatus === 'live' || candidate.reviewStatus === 'dismissed') continue

    const edits = editableFieldsFromCandidate(candidate)
    const matched =
      findMatchingEventsForCandidate({ ...candidate, ...edits }).find(
        (event) => event.status === 'Published',
      ) ||
      findLiveDuplicateForDraft(
        {
          id: localDraftId(candidate, edits),
          title: edits.title || candidate.title,
          city: asCity(edits.city || candidate.city),
          date: edits.date || candidate.date,
          eventUrl: edits.eventUrl || candidate.eventUrl || '#',
        },
        events,
      )

    if (!matched || matched.status !== 'Published') continue

    const existing = store[candidate.id]
    const wasReady = candidate.reviewStatus === 'approved'
    saveDiscoveryReviewRecord(candidate.id, {
      reviewStatus: 'live',
      edits: existing?.edits,
      convertedEventId: matched.id,
      approvedOn:
        existing?.approvedOn ||
        candidate.lastChecked ||
        edits.lastChecked ||
        matched.verifiedDate ||
        '',
      updatedAt: new Date().toISOString(),
    })
    if (wasReady) readyPromoted += 1
    else pendingPromoted += 1
  }

  return {
    events: currentAdminEvents(),
    draftsRemoved: removeIds.size,
    readyPromoted,
    pendingPromoted,
  }
}

/** @deprecated Prefer reconcileAdminWithLivedCatalog */
export function pruneDiscoveryDraftsAlreadyLive() {
  const result = reconcileAdminWithLivedCatalog()
  return {
    events: result.events,
    draftsRemoved: result.draftsRemoved,
    readyPromoted: result.readyPromoted,
  }
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
  assertDiscoveryCityInScope(candidate, edits)
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
  assertDiscoveryCityInScope(candidate, edits)
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
  draftsRemoved?: number
  readyPromoted?: number
  pendingPromoted?: number
} {
  ensureAdminEventsCacheSeeded()
  const pruned = reconcileAdminWithLivedCatalog()

  const store = loadDiscoveryReviewStore()
  const candidates = applyDiscoveryReviewOverrides(ALL_DISCOVERY_CANDIDATES, store)
  const ready = candidates.filter((candidate) => candidate.reviewStatus === 'approved')

  let draftsAdded = 0
  let verifiedUpdated = 0

  for (const candidate of ready) {
    const edits = editableFieldsFromCandidate(candidate)
    const verifiedDate = (candidate.lastChecked || edits.lastChecked || '').trim()
    if (!verifiedDate) continue

    const publishedMatch =
      findMatchingEventsForCandidate({ ...candidate, ...edits }).find(
        (event) => event.status === 'Published',
      ) || null

    if (candidate.alreadyOnPuddles || publishedMatch) {
      const matchedIds = publishedMatch
        ? [publishedMatch.id]
        : findMatchingEventIdsForCandidate({ ...candidate, ...edits })
      if (matchedIds.length === 0) continue

      if (!candidate.alreadyOnPuddles && publishedMatch) {
        const existing = store[candidate.id]
        saveDiscoveryReviewRecord(candidate.id, {
          reviewStatus: 'live',
          edits: existing?.edits,
          convertedEventId: publishedMatch.id,
          approvedOn: existing?.approvedOn || verifiedDate,
          updatedAt: new Date().toISOString(),
        })
      }

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
    const softLive = findLiveDuplicateForDraft(
      {
        id: draftId,
        title: edits.title || candidate.title,
        city: asCity(edits.city || candidate.city),
        date: targetDate,
        eventUrl: edits.eventUrl || candidate.eventUrl || '#',
      },
      events,
    )
    if (softLive) {
      const existing = store[candidate.id]
      saveDiscoveryReviewRecord(candidate.id, {
        reviewStatus: 'live',
        edits: existing?.edits,
        convertedEventId: softLive.id,
        approvedOn: existing?.approvedOn || verifiedDate,
        updatedAt: new Date().toISOString(),
      })
      continue
    }

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

    // Ready Regional / Worth-a-drive rows must not crash Admin when syncing drafts.
    // Approve / Go live still hard-block via assertDiscoveryCityInScope.
    const city = String(edits.city ?? candidate.city ?? '').trim()
    if (!(LAUNCH_CITIES as readonly string[]).includes(city)) continue

    try {
      appendDraftInAdminCache(candidate, edits, verifiedDate)
      draftsAdded += 1
    } catch {
      // Age/city asserts or corrupt rows — skip; do not take down Admin Events.
    }
  }

  return {
    events: currentAdminEvents(),
    draftsAdded,
    verifiedUpdated,
    draftsRemoved: pruned.draftsRemoved,
    readyPromoted: pruned.readyPromoted,
    pendingPromoted: pruned.pendingPromoted,
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
    assertDiscoveryAgeInScope(candidate, edits)
    assertDiscoveryCityInScope(candidate, edits)
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
