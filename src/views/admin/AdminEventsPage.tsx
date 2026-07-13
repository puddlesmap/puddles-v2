import { useMemo, useState } from 'react'
import { ALL_EVENTS } from '../../data/events'
import { AdminEventsTable } from '../../components/admin/AdminEventsTable'
import { AdminNeedsAttentionInbox } from '../../components/admin/AdminNeedsAttentionInbox'
import { AdminOverview } from '../../components/admin/AdminOverview'
import { AdminSyncBar } from '../../components/admin/AdminSyncBar'
import type { AdminEventViewId } from '../../types/admin'
import { ADMIN_EVENT_VIEWS } from '../../types/admin'
import type { Event } from '../../types/event'
import {
  filterAdminEvents,
  filterAdminEventsByView,
  getAdminEventView,
  summarizePublishingCounts,
} from '../../utils/adminEvents'
import {
  adminReviewFlagsEmailSummary,
  collectAdminReviewFlags,
  findDuplicateClusterForFlag,
  fingerprintAdminReviewFlags,
  type AdminReviewFlagType,
} from '../../utils/adminReviewFlags'
import {
  findDuplicateClusters,
  type DuplicateCluster,
} from '../../utils/eventDuplicates'
import { downloadRowsAsCsv } from '../../utils/exportCsv'
import { EVENT_EXPORT_COLUMNS, exportFilename } from '../../utils/adminExport'
import { enrichPublishingFields } from '../../utils/publishing'
import { callSheetApi } from '../../utils/sheetApi'
import {
  loadCachedAdminRefresh,
  refreshEventsFromSheet,
  saveCachedAdminRefresh,
} from '../../utils/sheetSync'
import { triggerPublishToSite } from '../../utils/triggerPublish'

const CITIES = ['All cities', 'Palo Alto', 'Los Altos', 'Mountain View'] as const
const REVIEW_EMAIL_NOTICE_KEY = 'puddles-admin-review-email-fingerprint'
const DISMISSED_FLAGS_KEY = 'puddles-admin-dismissed-review-flags'

function getInitialEvents(): Event[] {
  const cached = loadCachedAdminRefresh()
  return cached?.events ?? ALL_EVENTS
}

function loadDismissedFlagIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_FLAGS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

function persistDismissedFlagIds(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_FLAGS_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

export function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>(getInitialEvents)
  const [adminRefreshedAt, setAdminRefreshedAt] = useState<string | null>(() => {
    return loadCachedAdminRefresh()?.refreshedAt ?? null
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyClusterId, setBusyClusterId] = useState<string | null>(null)
  const [busyFlagId, setBusyFlagId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<AdminEventViewId | 'all'>('live')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState<(typeof CITIES)[number]>('All cities')
  const [flagTypeFilter, setFlagTypeFilter] = useState<'all' | AdminReviewFlagType>('all')
  const [dismissedFlagIds, setDismissedFlagIds] = useState<Set<string>>(loadDismissedFlagIds)

  const counts = useMemo(() => summarizePublishingCounts(events), [events])
  const viewMeta = activeView === 'all' ? null : getAdminEventView(activeView)
  const duplicateClusters = useMemo(() => findDuplicateClusters(events), [events])
  const allReviewFlags = useMemo(() => collectAdminReviewFlags(events), [events])
  const openReviewFlags = useMemo(
    () => allReviewFlags.filter((flag) => !dismissedFlagIds.has(flag.id)),
    [allReviewFlags, dismissedFlagIds],
  )
  const openNeedsAttentionCount = openReviewFlags.length

  const eventsById = useMemo(() => {
    const map = new Map<string, Event>()
    for (const event of events) map.set(event.id, event)
    return map
  }, [events])

  const filteredEvents = useMemo(() => {
    const base = activeView === 'all' ? events : filterAdminEventsByView(events, activeView)
    return filterAdminEvents(base, {
      search,
      city: city === 'All cities' ? 'all' : city,
    }).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
  }, [events, activeView, search, city])

  const visibleClusters = useMemo(() => {
    if (activeView !== 'duplicates') return []
    const allowedIds = new Set(filteredEvents.map((event) => event.id))
    return duplicateClusters
      .map((cluster) => {
        const members = cluster.members.filter((event) => allowedIds.has(event.id))
        if (members.length < 2) return null
        const winner =
          members.find((event) => event.id === cluster.winner.id) ?? members[0]!
        const losers = members.filter((event) => event.id !== winner.id)
        if (losers.length === 0) return null
        return {
          ...cluster,
          winner,
          losers,
          members: [winner, ...losers],
        }
      })
      .filter((cluster): cluster is DuplicateCluster => cluster != null)
  }, [activeView, duplicateClusters, filteredEvents])

  const overviewCounts = useMemo(
    () => ({
      ...counts,
      needsAttention: openNeedsAttentionCount,
    }),
    [counts, openNeedsAttentionCount],
  )

  async function maybeNotifyNeedsAttention(nextEvents: Event[]) {
    const flags = collectAdminReviewFlags(nextEvents)
    if (flags.length === 0) return

    const fingerprint = fingerprintAdminReviewFlags(flags)
    try {
      if (sessionStorage.getItem(REVIEW_EMAIL_NOTICE_KEY) === fingerprint) {
        return
      }
    } catch {
      // sessionStorage unavailable — still attempt notify once per refresh call.
    }

    const summary = adminReviewFlagsEmailSummary(flags)
    try {
      await callSheetApi({
        action: 'notifyAdminReviewFlags',
        payload: {
          to: 'puddlesmap@gmail.com',
          subject: summary.subject,
          body: summary.body,
          flagCount: summary.flagCount,
        },
      })
      try {
        sessionStorage.setItem(REVIEW_EMAIL_NOTICE_KEY, fingerprint)
      } catch {
        // ignore
      }
      setActionMessage(
        `Found ${summary.flagCount} item${summary.flagCount === 1 ? '' : 's'} that need attention. Email note sent to puddlesmap@gmail.com.`,
      )
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? `Needs attention found, but email note failed: ${error.message}`
          : 'Needs attention found, but email note failed.',
      )
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    setRefreshError(null)
    setActionMessage(null)
    try {
      const result = await refreshEventsFromSheet()
      setEvents(result.events)
      setAdminRefreshedAt(result.refreshedAt)
      saveCachedAdminRefresh(result)
      await maybeNotifyNeedsAttention(result.events)
    } catch (error) {
      setRefreshError(
        error instanceof Error
          ? `${error.message}. Try npm run sync-events locally, or check that the sheet is shared as Viewer.`
          : 'Could not refresh from Google Sheet.',
      )
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handlePublish() {
    setIsPublishing(true)
    setPublishError(null)
    setPublishMessage(null)
    setActionMessage(null)
    try {
      const message = await triggerPublishToSite()
      setPublishMessage(message)
    } catch (error) {
      setPublishError(
        error instanceof Error
          ? error.message
          : 'Could not start publish. Check GITHUB_DEPLOY_TOKEN on Netlify.',
      )
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleHide(event: Event, flagId?: string) {
    const confirmed = window.confirm(
      `Hide “${event.title}” from the public site?\n\nThis sets Status to Hidden in the Events tab. You can restore it from the sheet later.`,
    )
    if (!confirmed) return

    setBusyId(event.id)
    if (flagId) setBusyFlagId(flagId)
    setActionMessage(null)
    try {
      await callSheetApi({
        action: 'updateEventStatus',
        payload: { id: event.id, status: 'Hidden' },
      })
      setEvents((current) =>
        current.map((row) =>
          row.id === event.id ? enrichPublishingFields({ ...row, status: 'Hidden' }) : row,
        ),
      )
      setActionMessage(`“${event.title}” is now Hidden.`)
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not hide event.')
    } finally {
      setBusyId(null)
      setBusyFlagId(null)
    }
  }

  async function handleKeepWinner(cluster: DuplicateCluster) {
    const confirmed = window.confirm(
      `Keep “${cluster.winner.title}” and hide ${cluster.losers.length} duplicate${cluster.losers.length === 1 ? '' : 's'}?\n\nLosers will be set to Hidden in the Events tab.`,
    )
    if (!confirmed) return

    setBusyClusterId(cluster.id)
    setBusyFlagId(`duplicate:${cluster.id}`)
    setActionMessage(null)
    try {
      for (const loser of cluster.losers) {
        await callSheetApi({
          action: 'updateEventStatus',
          payload: { id: loser.id, status: 'Hidden' },
        })
      }
      const loserIds = new Set(cluster.losers.map((event) => event.id))
      setEvents((current) =>
        current.map((row) =>
          loserIds.has(row.id) ? enrichPublishingFields({ ...row, status: 'Hidden' }) : row,
        ),
      )
      setActionMessage(
        `Kept “${cluster.winner.title}” and hid ${cluster.losers.length} duplicate${cluster.losers.length === 1 ? '' : 's'}.`,
      )
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : 'Could not hide duplicate events.',
      )
    } finally {
      setBusyClusterId(null)
      setBusyFlagId(null)
    }
  }

  function handleDismissFlag(flagId: string) {
    setDismissedFlagIds((current) => {
      const next = new Set(current)
      next.add(flagId)
      persistDismissedFlagIds(next)
      return next
    })
    setActionMessage('Dismissed for this browser. Refresh or clear storage to see it again.')
  }

  function handleExportCsv() {
    const ok = downloadRowsAsCsv(
      exportFilename('events', filteredEvents.length),
      filteredEvents,
      EVENT_EXPORT_COLUMNS,
    )
    setExportMessage(
      ok
        ? `Exported ${filteredEvents.length} filtered events.`
        : 'Nothing to export — adjust filters or refresh data.',
    )
  }

  const isNeedsAttentionView = activeView === 'needs-attention'
  const isDuplicatesView = activeView === 'duplicates'

  return (
    <>
      <AdminSyncBar
        adminRefreshedAt={adminRefreshedAt}
        isRefreshing={isRefreshing}
        refreshError={refreshError}
        onRefresh={handleRefresh}
        isPublishing={isPublishing}
        publishError={publishError}
        publishMessage={publishMessage}
        onPublish={() => void handlePublish()}
      />

      <AdminOverview counts={overviewCounts} activeView={activeView} onSelectView={setActiveView} />

      {openNeedsAttentionCount > 0 && activeView !== 'needs-attention' ? (
        <p className="admin-needs-attention-banner">
          {openNeedsAttentionCount} item{openNeedsAttentionCount === 1 ? '' : 's'} need attention.{' '}
          <button
            type="button"
            className="admin-btn admin-btn-text"
            onClick={() => setActiveView('needs-attention')}
          >
            Review
          </button>
        </p>
      ) : null}

      <section className="admin-events-section">
        <div className="admin-events-header">
          <div>
            <h2 className="font-display text-lg text-charcoal">{viewMeta?.label ?? 'All events'}</h2>
            {viewMeta?.description && <p className="mt-1 text-sm text-muted">{viewMeta.description}</p>}
          </div>
          <div className="admin-events-header-actions">
            <div className="text-sm text-muted">
              {isNeedsAttentionView
                ? `${openNeedsAttentionCount} open flags`
                : isDuplicatesView
                  ? `${visibleClusters.length} groups · ${filteredEvents.length} events`
                  : `${filteredEvents.length} shown`}
            </div>
            {!isNeedsAttentionView ? (
              <button type="button" className="admin-btn admin-btn-secondary" onClick={handleExportCsv}>
                Export filtered CSV
              </button>
            ) : null}
          </div>
        </div>

        {exportMessage && <p className="admin-export-message">{exportMessage}</p>}
        {actionMessage && <p className="admin-export-message">{actionMessage}</p>}

        {!isNeedsAttentionView ? (
          <div className="admin-toolbar">
            <label className="admin-search">
              <span className="sr-only">Search events</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, venue, city…"
                className="admin-search-input"
              />
            </label>

            <label className="admin-select-wrap">
              <span className="admin-select-label">City</span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as (typeof CITIES)[number])}
                className="admin-select"
              >
                {CITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {activeView !== 'all' && (
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setActiveView('all')}>
                Show all
              </button>
            )}
          </div>
        ) : null}

        <div className="admin-view-tabs" role="tablist" aria-label="Saved views">
          {ADMIN_EVENT_VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={activeView === view.id}
              onClick={() => {
                setActiveView(view.id)
                if (view.id === 'duplicates') setFlagTypeFilter('duplicate')
                if (view.id === 'needs-attention') setFlagTypeFilter('all')
              }}
              className={`admin-btn ${activeView === view.id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              {view.label}
              {view.id === 'needs-attention' && openNeedsAttentionCount > 0
                ? ` (${openNeedsAttentionCount})`
                : ''}
              {view.id === 'duplicates' && counts.duplicateGroups > 0
                ? ` (${counts.duplicateGroups})`
                : ''}
            </button>
          ))}
        </div>

        {isNeedsAttentionView ? (
          <AdminNeedsAttentionInbox
            flags={openReviewFlags}
            eventsById={eventsById}
            typeFilter={flagTypeFilter}
            onTypeFilterChange={setFlagTypeFilter}
            busyFlagId={busyFlagId}
            onHideEvent={(event, flagId) => void handleHide(event, flagId)}
            onKeepWinner={(cluster) => void handleKeepWinner(cluster)}
            onDismiss={handleDismissFlag}
            resolveCluster={(flag) => findDuplicateClusterForFlag(events, flag)}
          />
        ) : (
          <AdminEventsTable
            events={filteredEvents}
            busyId={busyId}
            selectedId={selectedId}
            onSelect={(event) =>
              setSelectedId((current) => (current === event.id ? null : event.id))
            }
            onHide={(event) => void handleHide(event)}
            duplicateClusters={isDuplicatesView ? visibleClusters : undefined}
            busyClusterId={busyClusterId}
            onKeepWinner={handleKeepWinner}
          />
        )}
      </section>
    </>
  )
}
