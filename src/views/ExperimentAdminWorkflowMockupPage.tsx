import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { SeasonalBrowseCategoriesPreview } from '../components/seasonal/SeasonalBrowseCategoriesPreview'
import { SeasonalDiscoveryModule } from '../components/seasonal/SeasonalDiscoveryModule'
import { ALL_EVENTS } from '../data/events'
import {
  getSeasonalCollection,
  resolveFeaturedSeasonalEvents,
} from '../data/seasonalDiscovery'
import type { Event } from '../types/event'
import type { DiscoveryCandidate } from '../types/discovery'
import type { AdminEventEditableFields } from '../types/adminEventEdit'
import { PageContainer } from '../components/layout/PageContainer'
import { DetailRow, DetailSection } from '../components/admin/AdminDetailGrid'
import { AdminEventEditForm } from '../components/admin/AdminEventEditForm'
import { editableFieldsFromEvent } from '../utils/adminEventEdit'
import {
  approveDiscoveryLocally,
  upsertAdminCacheEvent,
} from '../utils/discoveryApproveLocal'
import {
  editableFieldsFromCandidate,
  pacificTodayYmd,
  saveDiscoveryReviewRecord,
} from '../utils/discoveryReview'
import { publishEventsToSite } from '../utils/publishEvents'
import { formatEventDate, formatEventTimeRange } from '../utils/dates'
import {
  FLAG_LABELS,
  HARVEST_FARMS_COLLECTION,
  INITIAL_CANDIDATES,
  INITIAL_SUGGESTIONS,
  INITIAL_WATCH_STATUS,
  PLANNED_COLLECTIONS,
  eventForLivePublish,
  findLiveDiscoveryCandidate,
  fitCollectionsForCandidate,
  geoForCity,
  isCoreCity,
  isRegularDraftEvent,
  isSeasonalDraftEvent,
  isUnplacedEvent,
  categoryTagsForCollections,
  findLiveMockupEvent,
  loadLiveInboxCandidates,
  loadLiveMockCatalogEvents,
  mockCandidateFromDiscovery,
  type MockCandidate,
  type MockCatalogEvent,
  type MockCollectionDef,
  type MockCollectionId,
  type MockReviewStatus,
  type MockSuggestion,
} from './experimentAdminWorkflowMockupData'
import {
  COVERAGE_GROUPS,
  THURSDAY_COVERAGE,
  THURSDAY_EXTRA_CANDIDATES,
  THURSDAY_WINDOW_PROPOSED,
  type CoverageItem,
  type CoverageKind,
  type CoverageMark,
} from './experimentThursdayAllSearchMockupData'
import './experiment-admin-workflow-mockup.css'

type Screen = 'inbox' | 'events' | 'collections' | 'sources'
type InboxFilter = 'due' | 'new' | 'watch' | 'skip' | 'all'
type EventsFilter = 'live' | 'draft' | 'seasonalDraft' | 'unplaced' | 'attention' | 'past'
type EventSortKey = 'title' | 'date' | 'venue' | 'area' | 'status' | 'collection'
type MockupMode = 'review' | 'thursday'

const MOCKUP_AS_OF = new Date('2026-09-14T12:00:00-07:00')

function stopRowToggle(event: MouseEvent) {
  event.stopPropagation()
}

function geoLabel(city: string): string {
  return isCoreCity(city) ? 'Core' : 'Out of area'
}

function eventsFilterForAdded(
  event: MockCatalogEvent | undefined,
  collections: MockCollectionId[],
  mode: 'existing' | 'draft',
): EventsFilter {
  if (mode === 'existing' || event?.status === 'Published') return 'live'
  const row = event
    ? { ...event, collections: event.collections.length > 0 ? event.collections : collections }
    : undefined
  if (row && isUnplacedEvent(row)) return 'unplaced'
  if ((row?.collections.length || collections.length) > 0) return 'seasonalDraft'
  return 'draft'
}

function isToastError(message: string): boolean {
  return /could not|outside|do not/i.test(message)
}

function canGoLiveEvent(event: MockCatalogEvent): boolean {
  return event.status === 'Draft' && !event.isPast && (isCoreCity(event.city) || event.collections.length > 0)
}

function isPendingLiveEdit(event: MockCatalogEvent): boolean {
  return event.status === 'Published' && Boolean(event.pendingDeploy) && !event.isPast
}

function applyEditsToMockCatalogEvent(
  event: MockCatalogEvent,
  edits: AdminEventEditableFields,
  collections: MockCollectionId[],
): MockCatalogEvent {
  const wasLive = event.status === 'Published'
  return {
    ...event,
    title: edits.title.trim() || event.title,
    dateSort: edits.date || event.dateSort,
    dateLabel: edits.date && edits.date !== event.dateSort ? edits.date : event.dateLabel,
    city: edits.city || event.city,
    venue: edits.venue.trim() || event.venue,
    type: edits.types[0] || event.type,
    ageGuidance: edits.ageRange,
    cost: edits.cost || event.cost,
    goodToKnow: edits.tips.trim() || event.goodToKnow,
    collections,
    description: edits.description,
    address: edits.address,
    room: edits.room,
    startTime: edits.startTime,
    endTime: edits.endTime,
    eventUrl: edits.eventUrl,
    imageUrl: edits.imageUrl,
    lastChecked: edits.lastChecked,
    openingDate: edits.date || event.openingDate,
    closingDate: edits.closingDate,
    scheduleKind: edits.scheduleKind,
    pendingDeploy: wasLive ? true : event.pendingDeploy,
  }
}

function browseEligible(city: string, status: 'Draft' | 'Published'): boolean {
  return status === 'Published' && isCoreCity(city)
}

function driveEligible(
  city: string,
  collections: MockCollectionId[],
  status: 'Draft' | 'Published',
): boolean {
  return status === 'Published' && !isCoreCity(city) && collections.length > 0
}

function statusBadgeClass(status: MockReviewStatus): string {
  if (status === 'new') return 'admin-badge-yes'
  if (status === 'watch') return 'admin-badge-status-hidden'
  if (status === 'skip') return 'admin-badge-no'
  if (status === 'draft') return 'admin-badge-status-draft'
  return 'admin-badge-status-published'
}

function statusLabel(status: MockReviewStatus): string {
  if (status === 'new') return 'New'
  if (status === 'watch') return 'Watch'
  if (status === 'skip') return 'Skip'
  if (status === 'draft') return 'Add / Draft'
  return 'Published'
}

function collectionLabel(
  id: MockCollectionId,
  collections: MockCollectionDef[],
): string {
  return collections.find((item) => item.id === id)?.name ?? id
}

export function ExperimentAdminWorkflowMockupPage({
  mode = 'review',
  live = false,
}: {
  mode?: MockupMode
  /** When true, this is `/admin`: Deploy calls publishEventsToSite. */
  live?: boolean
}) {
  const asOf = live ? new Date() : MOCKUP_AS_OF
  const [screen, setScreen] = useState<Screen>('inbox')
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('due')
  const [eventsFilter, setEventsFilter] = useState<EventsFilter>('live')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [reviewStatus, setReviewStatus] = useState<Record<string, MockReviewStatus>>(INITIAL_WATCH_STATUS)
  const [events, setEvents] = useState<MockCatalogEvent[]>(() => loadLiveMockCatalogEvents(asOf))
  const [liveInbox, setLiveInbox] = useState<DiscoveryCandidate[]>(() =>
    live ? loadLiveInboxCandidates() : [],
  )
  const [placementDraft, setPlacementDraft] = useState<Record<string, MockCollectionId[]>>({})
  const [extraCollections, setExtraCollections] = useState<MockCollectionDef[]>([])
  const [suggestions, setSuggestions] = useState<MockSuggestion[]>(INITIAL_SUGGESTIONS)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<EventSortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [coverageMarks, setCoverageMarks] = useState<Record<string, CoverageMark>>({})
  const [detailEventId, setDetailEventId] = useState<string | null>(null)
  const [deployBusy, setDeployBusy] = useState(false)

  const allCollections = [...PLANNED_COLLECTIONS, ...extraCollections]
  const candidates = live
    ? liveInbox.map(mockCandidateFromDiscovery)
    : mode === 'thursday'
      ? [...THURSDAY_EXTRA_CANDIDATES, ...INITIAL_CANDIDATES]
      : INITIAL_CANDIDATES

  function statusFor(candidate: MockCandidate): MockReviewStatus {
    return reviewStatus[candidate.id] ?? 'new'
  }

  function placementsFor(candidate: MockCandidate): MockCollectionId[] {
    if (Object.prototype.hasOwnProperty.call(placementDraft, candidate.id)) {
      return placementDraft[candidate.id]
    }
    return fitCollectionsForCandidate(candidate)
  }

  function flash(message: string) {
    setToast(message)
  }

  useEffect(() => {
    if (!toast || isToastError(toast)) return
    const timer = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(timer)
  }, [toast])

  function revealAddedEvent(
    eventId: string,
    nextEvents: MockCatalogEvent[],
    collections: MockCollectionId[],
    mode: 'existing' | 'draft',
  ) {
    const row = nextEvents.find((item) => item.id === eventId)
    setEvents(nextEvents)
    setScreen('events')
    setEventsFilter(eventsFilterForAdded(row, collections, mode))
    setSelectedEventId(eventId)
    setSelectedId(null)
    setSearch('')
  }

  function openCollectionEvent(eventId: string) {
    setDetailEventId(eventId)
  }

  useEffect(() => {
    if (!detailEventId) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setDetailEventId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailEventId])

  const inboxRows = useMemo(() => {
    const decorated = candidates.map((candidate) => {
      const status = reviewStatus[candidate.id] ?? 'new'
      const due = status === 'watch' && Boolean(candidate.recheckDue)
      return { candidate, status, due }
    })
    const filtered = decorated.filter(({ status, due }) => {
      if (inboxFilter === 'all') return true
      if (inboxFilter === 'due') return due || status === 'new'
      if (inboxFilter === 'new') return status === 'new'
      if (inboxFilter === 'watch') return status === 'watch'
      return status === 'skip'
    })
    return filtered.sort((a, b) => Number(b.due) - Number(a.due))
  }, [candidates, inboxFilter, reviewStatus])

  const dueCount = candidates.filter((candidate) => statusFor(candidate) === 'watch' && candidate.recheckDue).length
  const newCount = candidates.filter((candidate) => statusFor(candidate) === 'new').length
  const unplacedEvents = events.filter((event) => isUnplacedEvent(event) && !event.isPast)
  const liveCount = events.filter((event) => event.status === 'Published' && !event.isPast).length
  const regularDraftCount = events.filter(isRegularDraftEvent).length
  const seasonalDraftCount = events.filter(isSeasonalDraftEvent).length
  const attentionCount = events.filter((event) => Boolean(event.attention) && !event.isPast).length
  const pastCount = events.filter((event) => Boolean(event.isPast)).length
  const readyDraftCount = events.filter(canGoLiveEvent).length
  const pendingLiveCount = events.filter(isPendingLiveEdit).length
  const deployCount = readyDraftCount + pendingLiveCount
  const coverageTodoCount = THURSDAY_COVERAGE.filter(
    (item) => (coverageMarks[item.id] ?? item.defaultMark) !== 'looked',
  ).length

  const catalogRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = events.filter((event) => {
      if (eventsFilter === 'draft') {
        if (!isRegularDraftEvent(event)) return false
      } else if (eventsFilter === 'seasonalDraft') {
        if (!isSeasonalDraftEvent(event)) return false
      } else if (eventsFilter === 'unplaced') {
        if (!isUnplacedEvent(event) || event.isPast) return false
      } else if (eventsFilter === 'past') {
        if (!event.isPast) return false
      } else if (eventsFilter === 'attention') {
        if (!event.attention || event.isPast) return false
      } else if (event.status !== 'Published' || event.isPast) {
        return false
      }
      if (!query) return true
      return `${event.title} ${event.venue} ${event.city}`.toLowerCase().includes(query)
    })

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title)
      else if (sortKey === 'date') cmp = a.dateSort.localeCompare(b.dateSort)
      else if (sortKey === 'venue') cmp = a.venue.localeCompare(b.venue)
      else if (sortKey === 'area') cmp = Number(isCoreCity(b.city)) - Number(isCoreCity(a.city))
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status)
      else {
        const aName = a.collections[0] ? collectionLabel(a.collections[0], allCollections) : '—'
        const bName = b.collections[0] ? collectionLabel(b.collections[0], allCollections) : '—'
        cmp = aName.localeCompare(bName)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [events, eventsFilter, search, sortKey, sortDir, allCollections])

  function toggleSort(key: EventSortKey) {
    if (sortKey === key) setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'asc' : 'asc')
    }
  }

  function setCandidateStatus(id: string, status: MockReviewStatus, message: string) {
    setReviewStatus((current) => ({ ...current, [id]: status }))
    if (live && status === 'skip') {
      saveDiscoveryReviewRecord(id, {
        reviewStatus: 'dismissed',
        updatedAt: new Date().toISOString(),
      })
      setLiveInbox((current) => current.filter((item) => item.id !== id))
    }
    flash(message)
  }

  function addFlashForDestination(
    collections: MockCollectionId[],
    city: string,
    mode: 'existing' | 'draft',
  ) {
    const names = collections.map((id) => collectionLabel(id, allCollections)).join(', ')
    if (mode === 'existing') {
      flash(names ? `Already on ${names} (Live).` : 'Already on Puddles (Live).')
      return
    }
    if (!isCoreCity(city) && collections.length === 0) {
      flash(
        'Added as Unplaced Draft. Out of area with no collection — parents will not see it. Assign a collection before Deploy.',
      )
      return
    }
    flash(
      isCoreCity(city)
        ? names
          ? `Added as Seasonal draft · ${names}. Stays off the public site until Deploy.`
          : 'Added as Draft. Core city → Browse after Deploy. No seasonal section until a collection is checked.'
        : names
          ? `Added as Seasonal draft · ${names}. Out of area → Worth a little drive after Deploy.`
          : 'Added as Draft. Out of area — assign a collection before Deploy.',
    )
  }

  function addCandidate(candidate: MockCandidate, extraCollections?: MockCollectionId[]): boolean {
    const collections = extraCollections ?? placementsFor(candidate)
    if (live) {
      const discovery =
        liveInbox.find((item) => item.id === candidate.id) ?? findLiveDiscoveryCandidate(candidate.id)
      if (!discovery) {
        flash('Could not find that inbox item. Use Discovery backup if it disappeared.')
        return false
      }
      try {
        const verifiedDate = pacificTodayYmd()
        const edits = { ...editableFieldsFromCandidate(discovery), lastChecked: verifiedDate }
        const local = approveDiscoveryLocally(discovery, edits, verifiedDate, {
          allowRegional: true,
          isSeasonal: collections.length > 0,
          isRegional: !isCoreCity(candidate.city),
        })
        saveDiscoveryReviewRecord(discovery.id, {
          reviewStatus: local.mode === 'existing' ? 'live' : 'approved',
          convertedEventId: local.eventId,
          edits,
          approvedOn: verifiedDate,
          updatedAt: new Date().toISOString(),
        })
        if (local.mode === 'draft' && collections.length > 0) {
          const cached = findLiveMockupEvent(local.eventId)
          if (cached) {
            upsertAdminCacheEvent({
              ...cached,
              categoryTags: categoryTagsForCollections(cached.categoryTags, collections),
              isSeasonal: true,
            })
          }
        }
        let nextEvents = loadLiveMockCatalogEvents(new Date())
        if (local.mode === 'draft' && collections.length > 0) {
          nextEvents = nextEvents.map((item) =>
            item.id === local.eventId ? { ...item, collections } : item,
          )
        }
        setLiveInbox(loadLiveInboxCandidates())
        setReviewStatus((current) => ({
          ...current,
          [candidate.id]: local.mode === 'existing' ? 'published' : 'draft',
        }))
        revealAddedEvent(local.eventId, nextEvents, collections, local.mode)
        const row = nextEvents.find((item) => item.id === local.eventId)
        addFlashForDestination(row?.collections?.length ? row.collections : collections, candidate.city, local.mode)
      } catch (error) {
        flash(error instanceof Error ? error.message : 'Could not add as Draft.')
        return false
      }
      return true
    }
    const existing = events.find((event) => event.fromCandidateId === candidate.id)
    if (existing) {
      setReviewStatus((current) => ({ ...current, [candidate.id]: 'draft' }))
      revealAddedEvent(existing.id, events, existing.collections, existing.status === 'Published' ? 'existing' : 'draft')
      addFlashForDestination(existing.collections, existing.city, existing.status === 'Published' ? 'existing' : 'draft')
      return true
    }
    const event: MockCatalogEvent = {
      id: `evt-from-${candidate.id}`,
      title: candidate.title,
      dateLabel: candidate.dateLabel,
      dateSort: candidate.dateSort,
      city: candidate.city,
      venue: candidate.venue,
      type: candidate.type,
      status: 'Draft',
      ageGuidance: candidate.ageGuidance,
      cost: candidate.cost,
      goodToKnow: candidate.goodToKnow,
      collections,
      fromCandidateId: candidate.id,
      isPast: false,
    }
    const nextEvents = [event, ...events]
    setReviewStatus((current) => ({ ...current, [candidate.id]: 'draft' }))
    revealAddedEvent(event.id, nextEvents, collections, 'draft')
    addFlashForDestination(collections, candidate.city, 'draft')
    return true
  }

  function seasonalCandidate(candidate: MockCandidate) {
    const chosen = placementsFor(candidate)
    const collections: MockCollectionId[] = chosen.length > 0 ? chosen : ['hello-fall']
    setPlacementDraft((current) => ({ ...current, [candidate.id]: collections }))
    addCandidate(candidate, collections)
  }

  async function deployPending() {
    const eligible = events.filter(canGoLiveEvent)
    const pendingLive = events.filter(isPendingLiveEdit)
    if (eligible.length === 0 && pendingLive.length === 0) {
      flash('Nothing to Deploy. Eligible Drafts and saved Live edits ship together. Unplaced stays off this button.')
      return
    }
    if (live) {
      const n = eligible.length + pendingLive.length
      const ok = window.confirm(
        `Deploy ${n} change${n === 1 ? '' : 's'}?\n\nThey will be Published on the public site (usually updates in 2–4 minutes).`,
      )
      if (!ok) return
      setDeployBusy(true)
      try {
        const payloads = [...eligible, ...pendingLive].map((item) => ({
          ...eventForLivePublish(item),
          status: (isCoreCity(item.city) ? 'Published' : 'Hidden') as Event['status'],
        }))
        for (const event of payloads) upsertAdminCacheEvent(event)
        const message = await publishEventsToSite(payloads)
        setEvents(loadLiveMockCatalogEvents(new Date()))
        flash(message)
      } catch (error) {
        flash(error instanceof Error ? error.message : 'Could not Deploy.')
      } finally {
        setDeployBusy(false)
      }
      return
    }
    const draftIds = new Set(eligible.map((event) => event.id))
    setEvents((current) =>
      current.map((item) => {
        if (draftIds.has(item.id)) return { ...item, status: 'Published', pendingDeploy: false }
        if (item.pendingDeploy) return { ...item, pendingDeploy: false }
        return item
      }),
    )
    setReviewStatus((current) => {
      const next = { ...current }
      for (const event of eligible) {
        if (event.fromCandidateId) next[event.fromCandidateId] = 'published'
      }
      return next
    })
    const n = eligible.length + pendingLive.length
    flash(
      `Deployed ${n} change${n === 1 ? '' : 's'}. Mockup only — does not publish the live catalog.`,
    )
  }

  function saveMockEvent(next: MockCatalogEvent) {
    setEvents((current) => current.map((item) => (item.id === next.id ? next : item)))
    if (live) {
      try {
        upsertAdminCacheEvent(eventForLivePublish(next))
      } catch {
        // Admin cache persist is best-effort; Deploy still reads the in-memory row.
      }
    }
    flash(
      next.status === 'Published'
        ? 'Saved. Live listing waits for Deploy.'
        : 'Saved Draft. Parents still see nothing until Deploy.',
    )
  }

  function toggleEventCollection(eventId: string, collectionId: MockCollectionId) {
    setEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event
        const has = event.collections.includes(collectionId)
        return {
          ...event,
          collections: has
            ? event.collections.filter((id) => id !== collectionId)
            : [...event.collections, collectionId],
          pendingDeploy: event.status === 'Published' ? true : event.pendingDeploy,
        }
      }),
    )
  }

  function toggleCandidateCollection(candidateId: string, collectionId: MockCollectionId) {
    setPlacementDraft((current) => {
      const candidate = candidates.find((item) => item.id === candidateId)
      const existing = Object.prototype.hasOwnProperty.call(current, candidateId)
        ? current[candidateId]
        : candidate
          ? fitCollectionsForCandidate(candidate)
          : []
      const has = existing.includes(collectionId)
      return {
        ...current,
        [candidateId]: has ? existing.filter((id) => id !== collectionId) : [...existing, collectionId],
      }
    })
  }

  function approveSuggestion(suggestion: MockSuggestion) {
    if (suggestion.id === 'sug-harvest') {
      setExtraCollections((current) =>
        current.some((item) => item.id === 'harvest-farms') ? current : [...current, HARVEST_FARMS_COLLECTION],
      )
      setEvents((current) =>
        current.map((event) =>
          suggestion.eventIds.includes(event.id) && !event.collections.includes('harvest-farms')
            ? { ...event, collections: [...event.collections, 'harvest-farms'] }
            : event,
        ),
      )
      flash('Approved Harvest farms. Filoli joins that upcoming collection. Spina, Patchen, and Applefest stay on live Hello Fall drive.')
    } else {
      flash('Dismissed would be the usual call for this one — too thin for a collection.')
    }
    setSuggestions((current) => current.filter((item) => item.id !== suggestion.id))
  }

  function dismissSuggestion(id: string) {
    setSuggestions((current) => current.filter((item) => item.id !== id))
    flash('Suggestion dismissed. Events stay where they are.')
  }

  const currentCollections = allCollections.filter((item) => item.band === 'current')
  const upcomingCollections = allCollections.filter((item) => item.band === 'upcoming')
  const detailEvent = detailEventId ? events.find((item) => item.id === detailEventId) ?? null : null

  return (
    <div className="admin-shell">
      <header className="border-b border-border bg-white">
        <PageContainer layout="wide" className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                {live ? 'Puddles Admin' : 'Puddles Admin · mockup'}
              </div>
              <h1 className="mt-1 font-display text-xl text-charcoal">
                {live
                  ? 'Weekly discovery review'
                  : mode === 'thursday'
                    ? 'Thursday all-search'
                    : 'Weekly discovery review'}
              </h1>
              <p className="awm-lede">
                {live
                  ? 'Watch, Skip, or Add as Draft. Seasonal tags a theme. Save edits on one event. Header Deploy publishes eligible Drafts with the same Go live path as before. Discovery backup still has Go live.'
                  : mode === 'thursday'
                    ? `${THURSDAY_WINDOW_PROPOSED}. Thursday 8:00 AM PT hunts the core four and ~1 hour on the same morning. Inbox: Watch, Skip, or Add as Draft. Seasonal is Add plus a collection tag. Deploy ships eligible Drafts together. Nothing here publishes for real.`
                    : 'Watch, Skip, or Add as Draft. Seasonal tags a theme. Save edits on one event. Deploy in the header is the official publish. Nothing here writes the live catalog.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {live ? (
                <>
                  <Link to="/admin/discovery" className="admin-btn admin-btn-secondary">
                    Discovery backup
                  </Link>
                  <Link to="/admin/events" className="admin-btn admin-btn-secondary">
                    Classic Events
                  </Link>
                  <Link to="/admin/submissions" className="admin-btn admin-btn-secondary">
                    Submissions
                  </Link>
                  <Link to="/admin/seasonal-calendar" className="admin-btn admin-btn-secondary">
                    Seasonal calendar
                  </Link>
                </>
              ) : mode === 'thursday' ? (
                <Link to="/experiment/admin-workflow-mockup" className="admin-btn admin-btn-secondary">
                  Review mockup
                </Link>
              ) : (
                <Link to="/experiment/thursday-all-search-mockup" className="admin-btn admin-btn-secondary">
                  Thursday all-search
                </Link>
              )}
              {!live ? (
                <Link to="/admin/discovery" className="admin-btn admin-btn-secondary">
                  Current admin
                </Link>
              ) : null}
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => void deployPending()}
                disabled={deployCount === 0 || deployBusy}
              >
                {deployBusy ? 'Deploying…' : `Deploy (${deployCount})`}
              </button>
            </div>
          </div>
          <nav className="admin-section-nav" aria-label="Mock admin sections">
            {(
              [
                ['inbox', 'Inbox'],
                ['events', 'Events'],
                ['collections', 'Collections'],
                ['sources', coverageTodoCount > 0 ? `Sources (${coverageTodoCount} open)` : 'Sources'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`admin-btn ${screen === id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={() => setScreen(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        </PageContainer>
      </header>

      <PageContainer layout="wide" className="py-8">
        <div className="awm-banner" role="note">
          {live ? (
            <>
              <p>
                <strong>This is live Admin.</strong> Inbox Add opens Events → Draft (or Unplaced).
                Seasonal opens Seasonal draft. Already-live Hello Fall rows leave Inbox. Header{' '}
                <strong>Deploy</strong> publishes eligible Drafts the same way Discovery Go live
                does (~2–4 min). Unplaced stays off Deploy until a collection is assigned.
              </p>
              <p>
                If Deploy misbehaves, use <Link to="/admin/discovery">Discovery backup</Link> and
                its Go live button. Submissions and the seasonal calendar stay on their own routes.
              </p>
            </>
          ) : mode === 'thursday' ? (
            <>
              <p>
                <strong>Local mockup only.</strong> This is the Thursday 8:00 AM pass as a review
                workflow: scan the inbox, decide, then place. Sunday libraries stay a separate
                scrape. Hunt channels (web, roundups, Instagram, Facebook, 小紅書) apply to the core
                four and to Worth a little drive — split geography when you Add.
              </p>
              <p>
                <strong>Watch</strong> / <strong>Skip</strong> stay in Inbox.{' '}
                <strong>Add</strong> creates one Draft in Events → Draft (not live).{' '}
                <strong>Seasonal</strong> opens Events → Seasonal draft. Ingest auto-checks
                a collection when the date fits. <strong>Deploy</strong> ships every eligible Draft
                and saved Live edit at once. Unplaced (out of area, no collection) stays off Deploy.
              </p>
            </>
          ) : (
            <>
              <p>
                Out of area with no collection <strong>stays in Events → Unplaced</strong> as a Draft.
                Parents never see it until you assign a collection and Deploy — then it is Worth a
                little drive only, never Browse.
              </p>
              <p>
                Incomplete finds (dates TBA) stay Inbox Watch — not Unplaced. Ingest auto-tags
                Hello Fall / Halloween / Holiday when the date fits; uncheck if wrong. Collection
                <em> ideas</em> (Harvest farms) are Cursor suggestions you Approve or Dismiss.
                Watch, Skip, or Draft, then Deploy when the pile is right.
              </p>
            </>
          )}
        </div>

        {toast ? (
          <p
            className={`awm-toast${isToastError(toast) ? ' awm-toast--error' : ''}`}
            role="status"
          >
            {toast}
          </p>
        ) : null}

        {screen === 'inbox' ? (
          <>
            <h2 className="font-display text-xl text-charcoal">Discovery Inbox</h2>
            <p className="awm-lede">
              Scan Event · Date · City · Venue · Type · Source · Status. Add opens Events → Draft
              (or Unplaced). Seasonal opens Events → Seasonal draft. Already-live Hello Fall rows
              leave this list — they are on Events → Live.
            </p>
            <div className="awm-filters" role="tablist" aria-label="Inbox filters">
              {(
                [
                  ['due', `Needs a decision (${dueCount + newCount})`],
                  ['new', 'New'],
                  ['watch', 'Watch'],
                  ['skip', 'Skip'],
                  ['all', 'All'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`admin-btn ${inboxFilter === id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                  onClick={() => setInboxFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="awm-table-wrap">
              <table className="awm-table awm-table-inbox">
                <thead>
                  <tr>
                    <th className="awm-col-title">Event</th>
                    <th className="awm-col-date">Date</th>
                    <th className="awm-col-city">City</th>
                    <th className="awm-col-venue">Venue</th>
                    <th className="awm-col-type">Type</th>
                    <th className="awm-col-area">Geo</th>
                    <th className="awm-col-source">Source</th>
                    <th className="awm-col-status">Status</th>
                    <th className="awm-col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inboxRows.map(({ candidate, status, due }) => {
                    const open = selectedId === candidate.id
                    return (
                      <InboxRow
                        key={candidate.id}
                        candidate={candidate}
                        status={status}
                        due={due}
                        open={open}
                        collections={placementsFor(candidate)}
                        allCollections={allCollections}
                        onSelect={() => setSelectedId(open ? null : candidate.id)}
                        onAdd={() => addCandidate(candidate)}
                        onSeasonal={() => seasonalCandidate(candidate)}
                        onWatch={() =>
                          setCandidateStatus(
                            candidate.id,
                            'watch',
                            `Watch: ${candidate.watchReason || 'not ready yet'}. Incomplete stays here, not Unplaced.`,
                          )
                        }
                        onSkip={() =>
                          setCandidateStatus(candidate.id, 'skip', `Skipped: ${candidate.title}`)
                        }
                        onToggleCollection={(collectionId) =>
                          toggleCandidateCollection(candidate.id, collectionId)
                        }
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>

            <section className="awm-providers" aria-labelledby="awm-providers-title">
              <h3 id="awm-providers-title">This week’s coverage</h3>
              <p className="awm-lede" style={{ marginBottom: '0.75rem' }}>
                {THURSDAY_COVERAGE.filter((item) => (coverageMarks[item.id] ?? item.defaultMark) === 'looked').length} looked
                {' · '}
                {THURSDAY_COVERAGE.filter((item) => (coverageMarks[item.id] ?? item.defaultMark) === 'todo').length} still to check
                {' · '}
                {THURSDAY_COVERAGE.filter((item) => (coverageMarks[item.id] ?? item.defaultMark) === 'blocked').length} blocked.
                Libraries, venues, local providers, and search channels (including 小紅書 for core
                four and Worth a little drive) live on Sources. Marks are this week only.
              </p>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setScreen('sources')}>
                Open Sources
              </button>
            </section>
          </>
        ) : null}

        {screen === 'events' ? (
          <>
            <h2 className="font-display text-xl text-charcoal">Events</h2>
            <p className="awm-lede">
              One record per outing, synced from live Puddles / Admin in this browser. Draft = core
              city, no collection. Seasonal draft = a collection tag. Unplaced = out of area, no
              collection. Header Deploy publishes eligible Drafts and Seasonal drafts.
            </p>
            <div className="awm-filters">
              {(
                [
                  ['live', `Live (${liveCount})`],
                  ['draft', `Draft (${regularDraftCount})`],
                  ['seasonalDraft', `Seasonal draft (${seasonalDraftCount})`],
                  ['unplaced', `Unplaced (${unplacedEvents.length})`],
                  ['attention', `Needs attention (${attentionCount})`],
                  ['past', `Past (${pastCount})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`admin-btn ${eventsFilter === id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                  onClick={() => setEventsFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              className="awm-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, venue, city"
              aria-label="Search events"
            />
            <div className="awm-events-toolbar">
              <p className="awm-hint" style={{ margin: 0 }}>
                Header <strong>Deploy ({deployCount})</strong> ships eligible Drafts and saved Live
                edits. Unplaced out-of-area drafts stay off Deploy until you assign a collection.
              </p>
            </div>
            {eventsFilter === 'unplaced' ? (
              <p className="awm-unplaced-note">
                These events already have official dates. They stay here so next week does not
                rediscover them. Parents see nothing until you assign a seasonal collection and
                Deploy — then Worth a little drive only.
              </p>
            ) : null}
            {eventsFilter === 'seasonalDraft' ? (
              <p className="awm-unplaced-note">
                Unpublished with a collection tag. Header Deploy puts core-city rows on Browse and
                Hello Fall, and out-of-area rows on Worth a little drive only.
              </p>
            ) : null}
            {eventsFilter === 'draft' ? (
              <p className="awm-unplaced-note">
                Core-city drafts with no collection. They go to Browse after Deploy. Check a
                collection to move a row to Seasonal draft.
              </p>
            ) : null}
            {catalogRows.length === 0 ? (
              <p className="awm-empty">
                {eventsFilter === 'past' ? 'No past events in the live catalog.' : 'No events in this view.'}
              </p>
            ) : (
              <div className="awm-table-wrap">
                <table className="awm-table awm-table-events">
                  <thead>
                    <tr>
                      <SortHeader label="Title" column="title" active={sortKey} dir={sortDir} onSort={toggleSort} className="awm-col-title" />
                      <SortHeader label="Date" column="date" active={sortKey} dir={sortDir} onSort={toggleSort} className="awm-col-date" />
                      <SortHeader label="Venue" column="venue" active={sortKey} dir={sortDir} onSort={toggleSort} className="awm-col-venue" />
                      <SortHeader label="Area" column="area" active={sortKey} dir={sortDir} onSort={toggleSort} className="awm-col-area" />
                      <th className="awm-col-type">Type</th>
                      <SortHeader label="Collection" column="collection" active={sortKey} dir={sortDir} onSort={toggleSort} className="awm-col-collection" />
                      <SortHeader label="Status" column="status" active={sortKey} dir={sortDir} onSort={toggleSort} className="awm-col-status" />
                      <th className="awm-col-actions">Queue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalogRows.map((event) => {
                      const open = selectedEventId === event.id
                      return (
                        <EventRow
                          key={event.id}
                          event={event}
                          open={open}
                          allCollections={allCollections}
                          onSelect={() => setSelectedEventId(open ? null : event.id)}
                          onOpen={() => openCollectionEvent(event.id)}
                          onToggleCollection={(collectionId) =>
                            toggleEventCollection(event.id, collectionId)
                          }
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {screen === 'sources' ? (
          <SourcesCoverage
            items={THURSDAY_COVERAGE}
            marks={coverageMarks}
            onMark={(id, mark) => setCoverageMarks((current) => ({ ...current, [id]: mark }))}
          />
        ) : null}

        {screen === 'collections' ? (
          <>
            <h2 className="font-display text-xl text-charcoal">Seasonal collections</h2>
            <p className="awm-lede">
              Upcoming themes accumulate as soon as a fitting event is queued — they do not wait for
              Home start. Click an event to review in a two-column popup (Save only). Deploy in the
              header ships eligible Drafts. Harvest farms still needs Approve.
            </p>
            <PublicSiteNowStrip onEventClick={(event) => openCollectionEvent(event.id)} />
            <p className="awm-unplaced-note">
              {unplacedEvents.length} out-of-area event{unplacedEvents.length === 1 ? '' : 's'} waiting
              for a home.{' '}
              <button type="button" className="admin-btn-text" onClick={() => { setScreen('events'); setEventsFilter('unplaced') }}>
                Open Unplaced
              </button>
            </p>

            {suggestions.length > 0 ? (
              <>
                <h3 className="awm-band-title">Suggested (from Cursor)</h3>
                <div className="awm-collections">
                  {suggestions.map((suggestion) => (
                    <article key={suggestion.id} className="awm-suggest">
                      <h3>{suggestion.name}</h3>
                      <p className="awm-collection__meta">{suggestion.window} · not created until you Approve</p>
                      <p>{suggestion.reasoning}</p>
                      <ul>
                        {suggestion.eventIds.map((eventId) => {
                          const event = events.find((item) => item.id === eventId)
                          if (!event) return null
                          return (
                            <li key={eventId}>
                              <button type="button" className="awm-event-link" onClick={() => openCollectionEvent(event.id)}>
                                {event.title} · {event.city}
                                {isUnplacedEvent(event) ? ' · Unplaced' : ''}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                      <div className="awm-row-actions" style={{ marginTop: '0.85rem' }}>
                        <button type="button" className="admin-btn admin-btn-primary" onClick={() => approveSuggestion(suggestion)}>
                          Approve
                        </button>
                        <button type="button" className="admin-btn admin-btn-secondary" onClick={() => dismissSuggestion(suggestion.id)}>
                          Dismiss
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

            <h3 className="awm-band-title">Current</h3>
            <h4 className="awm-band-subtitle">Live</h4>
            <div className="awm-collections">
              {currentCollections.map((collection) => (
                <CollectionCard
                  key={`${collection.id}-live`}
                  collection={collection}
                  events={events}
                  phase="live"
                  onOpenEvent={openCollectionEvent}
                />
              ))}
            </div>
            <h4 className="awm-band-subtitle">Past</h4>
            <div className="awm-collections">
              {currentCollections.some((collection) =>
                collectionMembers(collection, events, 'past').length > 0,
              ) ? (
                currentCollections.map((collection) =>
                  collectionMembers(collection, events, 'past').length > 0 ? (
                    <CollectionCard
                      key={`${collection.id}-past`}
                      collection={collection}
                      events={events}
                      phase="past"
                      onOpenEvent={openCollectionEvent}
                    />
                  ) : null,
                )
              ) : (
                <p className="awm-empty">No past events in current collections yet.</p>
              )}
            </div>

            <h3 className="awm-band-title">Upcoming</h3>
            <div className="awm-collections">
              {upcomingCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  events={events}
                  onOpenEvent={openCollectionEvent}
                />
              ))}
            </div>
          </>
        ) : null}
      </PageContainer>
      {detailEvent ? (
        <MockupEventEditModal
          event={detailEvent}
          allCollections={allCollections}
          onClose={() => setDetailEventId(null)}
          onSave={(next) => {
            saveMockEvent(next)
            setDetailEventId(null)
          }}
        />
      ) : null}
    </div>
  )
}

function PublicSiteNowStrip({ onEventClick }: { onEventClick: (event: Event) => void }) {
  const asOf = new Date()
  const helloFall = getSeasonalCollection('hello-fall')
  const featured = helloFall
    ? resolveFeaturedSeasonalEvents(helloFall, ALL_EVENTS, asOf)
    : []

  return (
    <section className="awm-public-now" aria-labelledby="awm-public-now-title">
      <h3 id="awm-public-now-title">Parents currently see (live Home)</h3>
      <p className="awm-lede" style={{ marginBottom: '0.85rem' }}>
        Hello Fall banner and Browse by activity as they are on the public site today. Placement
        decisions above do not change this strip.
      </p>
      {helloFall ? (
        <div className="awm-public-now__band">
          <SeasonalDiscoveryModule
            collection={helloFall}
            events={featured}
            onEventClick={onEventClick}
            bandLayout="home"
            homeBandEyebrow="timing"
            homeBandCopyTone="neutral"
            asOf={asOf}
          />
        </div>
      ) : null}
      <SeasonalBrowseCategoriesPreview />
    </section>
  )
}

function MockupEventEditModal({
  event,
  allCollections,
  onClose,
  onSave,
}: {
  event: MockCatalogEvent
  allCollections: MockCollectionDef[]
  onClose: () => void
  onSave: (next: MockCatalogEvent) => void
}) {
  const source = eventForLivePublish(event)
  const [draft, setDraft] = useState(() => editableFieldsFromEvent(source))
  const [collections, setCollections] = useState<MockCollectionId[]>(event.collections)

  useEffect(() => {
    setDraft(editableFieldsFromEvent(eventForLivePublish(event)))
    setCollections(event.collections)
  }, [event])

  const saveDisabled = !draft.title.trim() || !draft.date.trim() || !draft.venue.trim()
  const statusLabelText = event.isPast ? 'Past' : event.status === 'Published' ? 'Live' : 'Draft'

  return (
    <div
      className="awm-detail-overlay"
      role="presentation"
      onClick={(click) => {
        if (click.target === click.currentTarget) onClose()
      }}
    >
      <div
        className="awm-detail-overlay__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="awm-admin-event-detail-title"
      >
        <div className="awm-detail-overlay__head">
          <div>
            <p className="awm-detail-overlay__kicker">Review this event</p>
            <h2 id="awm-admin-event-detail-title" className="font-display text-xl text-charcoal">
              {event.title}
            </h2>
            <p className="awm-hint">Save keeps edits on this listing. Deploy in the header ships the pile.</p>
          </div>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="awm-detail-overlay__body">
          <div className="admin-discovery-meta">
            <span className={`admin-badge ${event.status === 'Published' ? 'admin-badge-status-published' : 'admin-badge-status-draft'}`}>
              {statusLabelText}
            </span>
            {event.pendingDeploy ? <span className="awm-chip awm-chip-pending">Pending deploy</span> : null}
            {event.collections.map((id) => (
              <span key={id} className="admin-badge admin-badge-status admin-badge-status-draft">
                {collectionLabel(id, allCollections)}
              </span>
            ))}
            <span className="text-sm text-muted">ID: {event.id}</span>
          </div>
          <AdminEventEditForm draft={draft} onChange={setDraft} showStatus={false} twoColumn />
          <div className="awm-overlay-placement">
            <h4 className="admin-detail-section-title">Seasonal collections</h4>
            <div className="awm-placement">
              {allCollections.map((collection) => (
                <label key={collection.id}>
                  <input
                    type="checkbox"
                    checked={collections.includes(collection.id)}
                    onChange={() => {
                      setCollections((current) =>
                        current.includes(collection.id)
                          ? current.filter((id) => id !== collection.id)
                          : [...current, collection.id],
                      )
                    }}
                  />
                  <span>{collection.name}</span>
                </label>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted">
            Preview: {formatEventDate(draft.date)}
            {draft.closingDate.trim() && draft.closingDate !== draft.date
              ? ` – ${formatEventDate(draft.closingDate)}`
              : ''}{' '}
            · {formatEventTimeRange(draft.startTime, draft.endTime)} · {draft.venue || '—'}
          </p>
        </div>
        <div className="awm-detail-overlay__foot">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={saveDisabled}
            onClick={() => onSave(applyEditsToMockCatalogEvent(event, draft, collections))}
          >
            Save
          </button>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
            Close
          </button>
          {draft.eventUrl && draft.eventUrl !== '#' ? (
            <a href={draft.eventUrl} target="_blank" rel="noreferrer" className="admin-btn admin-btn-text">
              Official page ↗
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SortHeader({
  label,
  column,
  active,
  dir,
  onSort,
  className,
}: {
  label: string
  column: EventSortKey
  active: EventSortKey
  dir: 'asc' | 'desc'
  onSort: (key: EventSortKey) => void
  className: string
}) {
  const suffix = active === column ? (dir === 'asc' ? ' ↑' : ' ↓') : ''
  return (
    <th className={className} aria-sort={active === column ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="awm-sort" onClick={() => onSort(column)}>
        {label}
        {suffix}
      </button>
    </th>
  )
}

function collectionMembers(
  collection: MockCollectionDef,
  events: MockCatalogEvent[],
  phase?: 'live' | 'past',
) {
  return events.filter((event) => {
    if (!event.collections.includes(collection.id)) return false
    if (event.status !== 'Published' && event.status !== 'Draft') return false
    if (phase === 'past') return Boolean(event.isPast)
    if (phase === 'live') return !event.isPast
    return true
  })
}

function CollectionEventList({
  events,
  onOpenEvent,
}: {
  events: MockCatalogEvent[]
  onOpenEvent: (id: string) => void
}) {
  if (events.length === 0) return <p className="awm-empty">None yet</p>
  return (
    <ul>
      {events.map((event) => (
        <li key={event.id}>
          <button type="button" className="awm-event-link" onClick={() => onOpenEvent(event.id)}>
            {event.title} · {event.city}
            {event.status === 'Draft' ? ' · Draft' : ''}
            {event.pendingDeploy ? ' · Pending deploy' : ''}
          </button>
        </li>
      ))}
    </ul>
  )
}

function CollectionCard({
  collection,
  events,
  phase,
  onOpenEvent,
}: {
  collection: MockCollectionDef
  events: MockCatalogEvent[]
  phase?: 'live' | 'past'
  onOpenEvent: (id: string) => void
}) {
  const members = collectionMembers(collection, events, phase)
  const local = members.filter((event) => isCoreCity(event.city))
  const drive = members.filter((event) => !isCoreCity(event.city))
  const homeLabel =
    phase === 'past'
      ? 'Past'
      : collection.active
        ? 'Active on Home'
        : 'Fills as queued · Home later'
  return (
    <section className="awm-collection">
      <h3>{collection.name}</h3>
      <p className="awm-collection__meta">
        {collection.window} · {homeLabel} · {members.length} {members.length === 1 ? 'event' : 'events'}
      </p>
      <div className="awm-collection__cols">
        <div>
          <h4>Local (Browse + this theme)</h4>
          <CollectionEventList events={local} onOpenEvent={onOpenEvent} />
        </div>
        <div>
          <h4>Worth a little drive</h4>
          <CollectionEventList events={drive} onOpenEvent={onOpenEvent} />
        </div>
      </div>
    </section>
  )
}

function InboxRow({
  candidate,
  status,
  due,
  open,
  collections,
  allCollections,
  onSelect,
  onAdd,
  onSeasonal,
  onWatch,
  onSkip,
  onToggleCollection,
}: {
  candidate: MockCandidate
  status: MockReviewStatus
  due: boolean
  open: boolean
  collections: MockCollectionId[]
  allCollections: MockCollectionDef[]
  onSelect: () => void
  onAdd: () => void
  onSeasonal: () => void
  onWatch: () => void
  onSkip: () => void
  onToggleCollection: (id: MockCollectionId) => void
}) {
  const geo = geoForCity(candidate.city)
  return (
    <>
      <tr
        className={`admin-table-row-clickable${open ? ' admin-table-row-selected' : ''}${due ? ' awm-due' : ''}`}
        onClick={onSelect}
      >
        <td className="awm-col-title">
          <button
            type="button"
            className="awm-title-btn"
            aria-expanded={open}
            onClick={(event) => {
              event.stopPropagation()
              onSelect()
            }}
          >
            {candidate.title}
          </button>
          {due ? <div className="admin-event-meta">Due today · {candidate.watchReason}</div> : null}
          {candidate.match ? <div className="admin-event-meta">Possible match on site</div> : null}
          {collections.length > 0 && !candidate.match ? (
            <div className="admin-event-meta">
              Queued · {collections.map((id) => collectionLabel(id, allCollections)).join(', ')} — uncheck if
              wrong
            </div>
          ) : null}
        </td>
        <td className="awm-col-date">{candidate.dateLabel}</td>
        <td className="awm-col-city">{candidate.city}</td>
        <td className="awm-col-venue">{candidate.venue}</td>
        <td className="awm-col-type">{candidate.type}</td>
        <td className="awm-col-area">
          <span className={`admin-badge ${geo === 'core' ? 'admin-badge-yes' : 'admin-badge-status-hidden'}`}>
            {geo === 'core' ? 'Core' : 'Out of area'}
          </span>
        </td>
        <td className="awm-col-source">{candidate.source}</td>
        <td className="awm-col-status">
          <span className={`admin-badge ${statusBadgeClass(status)}`}>{statusLabel(status)}</span>
        </td>
        <td className="awm-col-actions" onClick={stopRowToggle}>
          <div className="awm-row-actions">
            <button type="button" className="admin-btn admin-btn-primary" onClick={onAdd} disabled={Boolean(candidate.match)}>
              Add
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onSeasonal} disabled={Boolean(candidate.match)}>
              Seasonal
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onWatch}>
              Watch
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onSkip}>
              Skip
            </button>
          </div>
          <a className="awm-source-link" href={candidate.officialUrl} target="_blank" rel="noreferrer">
            Source
          </a>
        </td>
      </tr>
      {open ? (
        <tr className="admin-table-expand-row">
          <td colSpan={9}>
            <CandidateDetail
              candidate={candidate}
              collections={collections}
              allCollections={allCollections}
              onAdd={onAdd}
              onSeasonal={onSeasonal}
              onWatch={onWatch}
              onSkip={onSkip}
              onFold={onSelect}
              onToggleCollection={onToggleCollection}
            />
          </td>
        </tr>
      ) : null}
    </>
  )
}

function CandidateDetail({
  candidate,
  collections,
  allCollections,
  onAdd,
  onSeasonal,
  onWatch,
  onSkip,
  onFold,
  onToggleCollection,
}: {
  candidate: MockCandidate
  collections: MockCollectionId[]
  allCollections: MockCollectionDef[]
  onAdd: () => void
  onSeasonal: () => void
  onWatch: () => void
  onSkip: () => void
  onFold: () => void
  onToggleCollection: (id: MockCollectionId) => void
}) {
  const core = isCoreCity(candidate.city)
  return (
    <div className="admin-table-expand-panel">
      <div className="awm-expand-toolbar">
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onFold}>
          Fold
        </button>
      </div>
      {candidate.match ? (
        <div className="awm-match">
          <p>
            <strong>Already in the catalog:</strong> {candidate.match.title} · {candidate.match.status}{' '}
            · {candidate.match.placement}. Do not add a second record to put this in Seasonal.
          </p>
        </div>
      ) : null}

      <div className="awm-detail">
        <DetailSection title="Core event">
          <DetailRow label="Name" value={candidate.title} />
          <DetailRow label="Venue" value={candidate.venue} />
          <DetailRow label="When" value={candidate.dateLabel} />
          <DetailRow label="City" value={candidate.city} />
          <DetailRow label="Geography" value={core ? 'Core area · Browse-eligible if Published' : 'Out of area · not Browse'} />
        </DetailSection>

        <DetailSection title="Puddles classification">
          <DetailRow label="Activity type" value={candidate.type} />
          <DetailRow label="Age (as stated)" value={candidate.ageGuidance || '— not stated; leave blank'} />
          <DetailRow label="Note" value={candidate.note} />
        </DetailSection>

        <DetailSection title="Parent logistics">
          <DetailRow label="Cost" value={candidate.cost || '— not stated'} />
          <DetailRow label="Registration" value={candidate.registration} />
          <DetailRow label="Good to know" value={candidate.goodToKnow || '— blank until the source supports it'} />
        </DetailSection>

        <div>
          <h4 className="admin-detail-section-title">Seasonal placement</h4>
          <div className="awm-placement">
            {allCollections.map((collection) => (
              <label key={collection.id}>
                <input
                  type="checkbox"
                  checked={collections.includes(collection.id)}
                  onChange={() => onToggleCollection(collection.id)}
                />
                <span>{collection.name}</span>
              </label>
            ))}
            <p className="awm-hint">
              {collections.length > 0
                ? `Queued · ${collections.map((id) => collectionLabel(id, allCollections)).join(', ')} — uncheck if wrong.`
                : core
                  ? 'No seasonal fit yet (year-round or dates TBA). Checking Hello Fall still keeps Browse.'
                  : 'If you Add with no collection, this stays Unplaced (admin only). Worth a little drive turns on only after a collection + Deploy.'}
            </p>
          </div>
        </div>

        <div className="awm-detail__source">
          <DetailSection title="Source / verification">
            <DetailRow label="Official URL" value={candidate.officialUrl} />
            <DetailRow label="Source type" value={candidate.sourceType} />
            <DetailRow label="Last checked" value={candidate.lastChecked} />
            {candidate.watchReason ? <DetailRow label="Watch because" value={candidate.watchReason} /> : null}
            {candidate.missing ? <DetailRow label="Missing" value={candidate.missing} /> : null}
            {candidate.recheckDate ? <DetailRow label="Recheck" value={candidate.recheckDate} /> : null}
            {candidate.registrationOpens ? (
              <DetailRow label="Registration opens" value={candidate.registrationOpens} />
            ) : null}
          </DetailSection>
          <div className="awm-flags">
            {candidate.flags.map((flag) => {
              const meta = FLAG_LABELS[flag]
              return (
                <span
                  key={flag}
                  className={`awm-flag ${flag === 'official-source' ? 'awm-flag-ok' : 'awm-flag-warn'}`}
                >
                  {meta.mark} {meta.label}
                </span>
              )
            })}
          </div>
          <div className="awm-row-actions" style={{ marginTop: '0.85rem' }}>
            <button type="button" className="admin-btn admin-btn-primary" onClick={onAdd} disabled={Boolean(candidate.match)}>
              Add as Draft
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onSeasonal} disabled={Boolean(candidate.match)}>
              Add to Seasonal
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onWatch}>
              Watch
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onSkip}>
              Skip
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onFold}>
              Fold
            </button>
            <a className="admin-btn admin-btn-secondary" href={candidate.officialUrl} target="_blank" rel="noreferrer">
              Open source
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function EventRow({
  event,
  open,
  allCollections,
  onSelect,
  onOpen,
  onToggleCollection,
}: {
  event: MockCatalogEvent
  open: boolean
  allCollections: MockCollectionDef[]
  onSelect: () => void
  onOpen: () => void
  onToggleCollection: (id: MockCollectionId) => void
}) {
  const inBrowse = browseEligible(event.city, event.status)
  const inDrive = driveEligible(event.city, event.collections, event.status)
  const unplaced = isUnplacedEvent(event)
  const waitingDeploy = canGoLiveEvent(event)
  return (
    <>
      <tr
        className={`admin-table-row-clickable${open ? ' admin-table-row-selected' : ''}`}
        onClick={onSelect}
      >
        <td className="awm-col-title">
          <button
            type="button"
            className="awm-title-btn"
            aria-expanded={open}
            onClick={(event) => {
              event.stopPropagation()
              onSelect()
            }}
          >
            {event.title}
          </button>
          {event.attention ? <div className="admin-event-meta">{event.attention}</div> : null}
        </td>
        <td className="awm-col-date">{event.dateLabel}</td>
        <td className="awm-col-venue">{event.venue}</td>
        <td className="awm-col-area">
          {event.city}
          <div className="admin-event-meta">{geoLabel(event.city)}</div>
        </td>
        <td className="awm-col-type">{event.type}</td>
        <td className="awm-col-collection">
          <div className="awm-chips">
            {inBrowse ? <span className="awm-chip awm-chip-browse">Browse</span> : null}
            {event.collections.map((id) => (
              <span key={id} className="awm-chip awm-chip-seasonal">
                {collectionLabel(id, allCollections)}
              </span>
            ))}
            {inDrive ? <span className="awm-chip awm-chip-drive">Worth a little drive</span> : null}
            {unplaced ? <span className="awm-chip">Unplaced · not public</span> : null}
            {event.pendingDeploy ? <span className="awm-chip awm-chip-pending">Pending deploy</span> : null}
          </div>
        </td>
        <td className="awm-col-status">
          <span className={`admin-badge ${event.status === 'Published' ? 'admin-badge-status-published' : 'admin-badge-status-draft'}`}>
            {event.status}
          </span>
        </td>
        <td className="awm-col-actions">
          {unplaced ? (
            <span className="admin-event-meta">Needs collection</span>
          ) : waitingDeploy ? (
            <span className="admin-event-meta">Waiting for Deploy</span>
          ) : event.pendingDeploy ? (
            <span className="admin-event-meta">Pending deploy</span>
          ) : event.isPast ? (
            <span className="admin-event-meta">Past</span>
          ) : (
            <span className="admin-event-meta">Live</span>
          )}
        </td>
      </tr>
      {open ? (
        <tr className="admin-table-expand-row">
          <td colSpan={8}>
            <div className="admin-table-expand-panel">
              <div className="awm-expand-toolbar">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={onSelect}>
                  Fold
                </button>
              </div>
              <div className="awm-detail">
                <DetailSection title="Core event">
                  <DetailRow label="Venue" value={event.venue} />
                  <DetailRow label="When" value={event.dateLabel} />
                  <DetailRow
                    label="Geography"
                    value={
                      isCoreCity(event.city)
                        ? 'Core area · Browse after Deploy'
                        : unplaced
                          ? 'Out of area · Unplaced · not on the public site'
                          : 'Out of area · Seasonal / Worth a little drive only'
                    }
                  />
                  <DetailRow label="Age (as stated)" value={event.ageGuidance || '— not stated'} />
                  <DetailRow label="Cost" value={event.cost} />
                  <DetailRow label="Good to know" value={event.goodToKnow || '—'} />
                </DetailSection>
                <div>
                  <h4 className="admin-detail-section-title">Quick edits</h4>
                  <div className="awm-placement">
                    {allCollections.map((collection) => (
                      <label key={collection.id}>
                        <input
                          type="checkbox"
                          checked={event.collections.includes(collection.id)}
                          onChange={() => onToggleCollection(collection.id)}
                        />
                        <span>{collection.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="awm-hint">
                    {isCoreCity(event.city)
                      ? 'Cannot mark Worth a little drive — this city is local.'
                      : event.collections.length > 0
                        ? 'Out of area + on a collection → Worth a little drive after Deploy.'
                        : 'Stays Unplaced until a collection is checked. Deploy skips it.'}
                  </p>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    style={{ marginTop: '0.75rem' }}
                    onClick={onOpen}
                  >
                    Open to Save
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    style={{ marginTop: '0.75rem', marginLeft: '0.5rem' }}
                    onClick={onSelect}
                  >
                    Fold
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

function SourcesCoverage({
  items,
  marks,
  onMark,
}: {
  items: CoverageItem[]
  marks: Record<string, CoverageMark>
  onMark: (id: string, mark: CoverageMark) => void
}) {
  const [kind, setKind] = useState<'all' | CoverageKind>('all')
  const [markFilter, setMarkFilter] = useState<'all' | CoverageMark>('all')

  const markOf = (item: CoverageItem) => marks[item.id] ?? item.defaultMark
  const looked = items.filter((item) => markOf(item) === 'looked').length
  const todo = items.filter((item) => markOf(item) === 'todo').length
  const blocked = items.filter((item) => markOf(item) === 'blocked').length

  const visible = items.filter((item) => {
    if (kind !== 'all' && item.kind !== kind) return false
    if (markFilter !== 'all' && markOf(item) !== markFilter) return false
    return true
  })

  const groups = kind === 'all' ? COVERAGE_GROUPS : COVERAGE_GROUPS.filter((group) => group.kind === kind)

  return (
    <>
      <h2 className="font-display text-xl text-charcoal">Sources looked into</h2>
      <p className="awm-lede">
        Check off what this week’s review actually opened — Thursday (core four + ~1 hour).
        Both hunts use the same channels, including 小紅書. Libraries, city venues, local class
        providers, then hunt channels. Roundups and social are pointers — the official page is still
        required before Add. Marks reset next week unless you check them again.
      </p>
      <p className="awm-unplaced-note">
        {looked} looked · {todo} still to check · {blocked} blocked (e.g. Sunnyvale Library scrape).
      </p>
      <div className="awm-filters" role="tablist" aria-label="Source type">
        {(
          [
            ['all', 'All'],
            ['library', 'Libraries'],
            ['venue', 'Venues'],
            ['provider', 'Local providers'],
            ['channel', 'Channels'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`admin-btn ${kind === id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setKind(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="awm-filters" role="tablist" aria-label="Coverage status">
        {(
          [
            ['all', 'Any status'],
            ['looked', `Looked (${looked})`],
            ['todo', `To do (${todo})`],
            ['blocked', `Blocked (${blocked})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`admin-btn ${markFilter === id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setMarkFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {groups.map((group) => {
        const rows = visible.filter((item) => item.kind === group.kind)
        if (rows.length === 0) return null
        return (
          <section key={group.kind} className="awm-coverage-group" aria-labelledby={`awm-cov-${group.kind}`}>
            <h3 id={`awm-cov-${group.kind}`}>{group.title}</h3>
            <p className="awm-lede" style={{ marginBottom: '0.75rem' }}>
              {group.lede}
            </p>
            <div className="awm-table-wrap">
              <table className="awm-table awm-table-coverage">
                <thead>
                  <tr>
                    <th className="awm-col-title">Source</th>
                    <th className="awm-col-city">Where</th>
                    <th>What we check</th>
                    <th className="awm-col-status">This week</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const mark = markOf(item)
                    return (
                      <tr key={item.id}>
                        <td className="awm-col-title">
                          <div className="admin-event-title">{item.name}</div>
                        </td>
                        <td className="awm-col-city">{item.city}</td>
                        <td>{item.note}</td>
                        <td className="awm-col-status">
                          <label className="awm-coverage-select">
                            <span className="sr-only">Mark {item.name}</span>
                            <select
                              value={mark}
                              onChange={(e) => onMark(item.id, e.target.value as CoverageMark)}
                            >
                              <option value="looked">Looked</option>
                              <option value="todo">To do</option>
                              <option value="blocked">Blocked</option>
                            </select>
                          </label>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </>
  )
}
