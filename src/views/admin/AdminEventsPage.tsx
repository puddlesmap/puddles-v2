import { useEffect, useMemo, useState } from 'react'
import { AdminEventsTable } from '../../components/admin/AdminEventsTable'
import { AdminNeedsAttentionFilters } from '../../components/admin/AdminNeedsAttentionInbox'
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
  fingerprintAdminReviewFlags,
  type AdminReviewFlag,
  type AdminReviewFlagType,
} from '../../utils/adminReviewFlags'
import { findDuplicateClusters, type DuplicateCluster } from '../../utils/eventDuplicates'
import { downloadRowsAsCsv } from '../../utils/exportCsv'
import { EVENT_EXPORT_COLUMNS, exportFilename } from '../../utils/adminExport'
import { enrichPublishingFields } from '../../utils/publishing'
import { pacificTodayYmd } from '../../utils/discoveryReview'
import { syncReadyDiscoveryIntoAdminCache } from '../../utils/discoveryApproveLocal'
import { cancelAndPublishEvent, saveAndPublishEvent } from '../../utils/adminEventEdit'
import type { AdminEventEditableFields } from '../../types/adminEventEdit'
import { callSheetApi } from '../../utils/sheetApi'
import {
  refreshEventsFromSheet,
  saveCachedAdminRefresh,
} from '../../utils/sheetSync'
import { triggerPublishToSite } from '../../utils/triggerPublish'

const CITIES = ['All cities', 'Palo Alto', 'Los Altos', 'Mountain View'] as const
const REVIEW_EMAIL_NOTICE_KEY = 'puddles-admin-review-email-fingerprint'
const DISMISSED_FLAGS_KEY = 'puddles-admin-dismissed-review-flags'
const EVENTS_MONITOR_VIEWS = ADMIN_EVENT_VIEWS.filter((view) =>
  view.id === 'live' || view.id === 'needs-attention' || view.id === 'past',
)

function getInitialAdminState(): {
  events: Event[]
  refreshedAt: string | null
} {
  const synced = syncReadyDiscoveryIntoAdminCache()
  return {
    events: synced.events.map((event) => enrichPublishingFields(event)),
    refreshedAt: new Date().toISOString(),
  }
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
  const [initial] = useState(getInitialAdminState)
  const [events, setEvents] = useState<Event[]>(initial.events)
  const [adminRefreshedAt, setAdminRefreshedAt] = useState<string | null>(initial.refreshedAt)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyClusterId, setBusyClusterId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const [activeView, setActiveView] = useState<AdminEventViewId | 'all'>('live')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState<(typeof CITIES)[number]>('All cities')
  const [flagTypeFilter, setFlagTypeFilter] = useState<'all' | AdminReviewFlagType>('all')
  const [dismissedFlagIds, setDismissedFlagIds] = useState<Set<string>>(loadDismissedFlagIds)

  useEffect(() => {
    function reloadFromDiscoveryReady() {
      const synced = syncReadyDiscoveryIntoAdminCache()
      if (synced.draftsAdded === 0 && synced.verifiedUpdated === 0) return
      setEvents(synced.events.map((event) => enrichPublishingFields(event)))
      setAdminRefreshedAt(new Date().toISOString())
    }

    function onVisible() {
      if (document.visibilityState === 'visible') reloadFromDiscoveryReady()
    }

    window.addEventListener('focus', reloadFromDiscoveryReady)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', reloadFromDiscoveryReady)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => {
    setCheckedIds([])
    setSelectedId(null)
  }, [activeView, search, city, flagTypeFilter])

  const counts = useMemo(() => summarizePublishingCounts(events), [events])
  const viewMeta = activeView === 'all' ? null : getAdminEventView(activeView)
  const liveEventIds = useMemo(
    () => new Set(events.filter((event) => event.isLive).map((event) => event.id)),
    [events],
  )
  const allReviewFlags = useMemo(() => collectAdminReviewFlags(events), [events])
  const openReviewFlags = useMemo(
    () =>
      allReviewFlags.filter(
        (flag) =>
          !dismissedFlagIds.has(flag.id) && flag.eventIds.some((id) => liveEventIds.has(id)),
      ),
    [allReviewFlags, dismissedFlagIds, liveEventIds],
  )
  const openNeedsAttentionCount = openReviewFlags.length

  const visibleNeedsAttentionFlags = useMemo(() => {
    if (flagTypeFilter === 'all') return openReviewFlags
    return openReviewFlags.filter((flag) => flag.type === flagTypeFilter)
  }, [openReviewFlags, flagTypeFilter])

  const needsAttentionFlagsByEventId = useMemo(() => {
    const map = new Map<string, AdminReviewFlag[]>()
    for (const flag of visibleNeedsAttentionFlags) {
      for (const eventId of flag.eventIds) {
        const existing = map.get(eventId) ?? []
        existing.push(flag)
        map.set(eventId, existing)
      }
    }
    return map
  }, [visibleNeedsAttentionFlags])

  const needsAttentionEvents = useMemo(() => {
    const ids = new Set(visibleNeedsAttentionFlags.flatMap((flag) => flag.eventIds))
    return filterAdminEvents(
      events.filter((event) => event.isLive && ids.has(event.id)),
      {
        search,
        city: city === 'All cities' ? 'all' : city,
      },
    ).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
  }, [events, visibleNeedsAttentionFlags, search, city])

  const needsAttentionDuplicateClusters = useMemo(() => {
    if (flagTypeFilter !== 'duplicate') return undefined
    const clusterIds = new Set(
      openReviewFlags
        .filter((flag) => flag.type === 'duplicate' && flag.clusterId)
        .map((flag) => flag.clusterId as string),
    )
    if (clusterIds.size === 0) return undefined
    return findDuplicateClusters(events).filter((cluster) => clusterIds.has(cluster.id))
  }, [events, flagTypeFilter, openReviewFlags])

  const filteredEvents = useMemo(() => {
    if (activeView === 'needs-attention') {
      return needsAttentionEvents
    }

    let base: Event[]
    if (activeView === 'all') {
      base = events
    } else {
      base = filterAdminEventsByView(events, activeView)
    }
    return filterAdminEvents(base, {
      search,
      city: city === 'All cities' ? 'all' : city,
    }).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
  }, [events, activeView, search, city, needsAttentionEvents])

  const overviewCounts = useMemo(
    () => ({
      live: counts.live,
      past: counts.past,
      needsAttention: openNeedsAttentionCount,
    }),
    [counts.live, counts.past, openNeedsAttentionCount],
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
      const events = result.events.map((event) => enrichPublishingFields(event))
      setEvents(events)
      setAdminRefreshedAt(result.refreshedAt)
      saveCachedAdminRefresh({ events, refreshedAt: result.refreshedAt })
      await maybeNotifyNeedsAttention(events)
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
    const ok = window.confirm(
      'Legacy import: this re-syncs the entire Google Sheet and deploys.\n\n' +
        'It can overwrite Admin Go live edits (descriptions, types, tips).\n\n' +
        'Use Discovery or Submissions → Go live for normal publishing.\n\nContinue?',
    )
    if (!ok) return

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

  async function handleCancel(event: Event) {
    const ok = window.confirm(
      `Cancel “${event.title}”?\n\n` +
        'It will be removed from Browse and Map. Anyone with the event link will see a cancelled message.',
    )
    if (!ok) return

    setBusyId(event.id)
    setActionMessage(null)
    try {
      const { message, event: published } = await cancelAndPublishEvent(event)
      setEvents((current) => {
        const next = current.map((row) => (row.id === event.id ? published : row))
        saveCachedAdminRefresh({ events: next, refreshedAt: new Date().toISOString() })
        return next
      })
      setAdminRefreshedAt(new Date().toISOString())
      setActionMessage(message)
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not cancel event.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleSaveAndPublish(event: Event, edits: AdminEventEditableFields) {
    const ok = window.confirm(
      `Save & publish “${event.title}”?\n\nThis updates the public catalog in ~2–4 minutes.`,
    )
    if (!ok) return

    setBusyId(event.id)
    setActionMessage(null)
    try {
      const { message, event: published } = await saveAndPublishEvent(event, edits)
      setEvents((current) => {
        const next = current.map((row) => (row.id === event.id ? published : row))
        saveCachedAdminRefresh({ events: next, refreshedAt: new Date().toISOString() })
        return next
      })
      setAdminRefreshedAt(new Date().toISOString())
      setActionMessage(message)
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not save and publish.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleApproveVerified(event: Event) {
    const approvedOn = pacificTodayYmd()
    setBusyId(event.id)
    setActionMessage(null)
    try {
      await callSheetApi({
        action: 'updateEventVerifiedDate',
        payload: { id: event.id, verifiedDate: approvedOn },
      })
      setEvents((current) => {
        const next = current.map((row) =>
          row.id === event.id
            ? enrichPublishingFields({ ...row, verifiedDate: approvedOn })
            : row,
        )
        saveCachedAdminRefresh({ events: next, refreshedAt: new Date().toISOString() })
        return next
      })
      setAdminRefreshedAt(new Date().toISOString())
      setActionMessage(
        `“${event.title}” — Approved on ${approvedOn}. That is Last Checked / Verified on Puddles after Publish to site.`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update approved date.'
      const needsDeploy = /unknown action/i.test(message)
      setActionMessage(
        needsDeploy
          ? `${message} Redeploy google-apps-script/PuddlesSheetApi.gs (New version) so Approve can update Last Checked Date.`
          : message,
      )
    } finally {
      setBusyId(null)
    }
  }

  async function handleBulkApproveVerified(rows: Event[]) {
    if (rows.length === 0) return
    const approvedOn = pacificTodayYmd()
    const ok = window.confirm(
      `Approve ${rows.length} event${rows.length === 1 ? '' : 's'}?\n\nApproved on / Last checked will be set to ${approvedOn}.`,
    )
    if (!ok) return

    setBulkBusy(true)
    setActionMessage(null)
    const ids = rows.map((event) => event.id)
    try {
      await callSheetApi({
        action: 'bulkUpdateEventVerifiedDate',
        payload: { ids, verifiedDate: approvedOn },
      })
      const succeededIds = new Set(ids)
      setEvents((current) => {
        const next = current.map((row) =>
          succeededIds.has(row.id)
            ? enrichPublishingFields({ ...row, verifiedDate: approvedOn })
            : row,
        )
        saveCachedAdminRefresh({ events: next, refreshedAt: new Date().toISOString() })
        return next
      })
      setAdminRefreshedAt(new Date().toISOString())
      setCheckedIds([])
      setActionMessage(
        `Approved ${ids.length} event${ids.length === 1 ? '' : 's'} — Approved on ${approvedOn}.`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not approve selected events.'
      const needsDeploy = /unknown action/i.test(message)
      setActionMessage(
        needsDeploy
          ? `${message} Redeploy google-apps-script/PuddlesSheetApi.gs (New version) so bulk Approve works.`
          : message,
      )
    } finally {
      setBulkBusy(false)
    }
  }

  function handleToggleChecked(eventId: string) {
    setCheckedIds((current) =>
      current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId],
    )
  }

  function handleToggleCheckAll(checked: boolean) {
    if (!checked) {
      setCheckedIds((current) => current.filter((id) => !filteredEvents.some((e) => e.id === id)))
      return
    }
    setCheckedIds((current) => {
      const next = new Set(current)
      for (const event of filteredEvents) next.add(event.id)
      return [...next]
    })
  }

  async function handleHide(event: Event) {
    const confirmed = window.confirm(
      `Hide “${event.title}” from the public site?\n\n` +
        'The event link will show a generic unavailable message. Use Cancel instead for a cancelled notice.',
    )
    if (!confirmed) return

    setBusyId(event.id)
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
    }
  }

  async function handleKeepWinner(cluster: DuplicateCluster) {
    const confirmed = window.confirm(
      `Keep “${cluster.winner.title}” and hide ${cluster.losers.length} duplicate${cluster.losers.length === 1 ? '' : 's'}?\n\nLosers will be set to Hidden in the Events tab.`,
    )
    if (!confirmed) return

    setBusyClusterId(cluster.id)
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
          {openNeedsAttentionCount} live item{openNeedsAttentionCount === 1 ? '' : 's'} need attention.{' '}
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
            <h2 className="font-display text-lg text-charcoal">{viewMeta?.label ?? 'Events'}</h2>
            {viewMeta?.description && <p className="mt-1 text-sm text-muted">{viewMeta.description}</p>}
          </div>
          <div className="admin-events-header-actions">
            <div className="text-sm text-muted">
              {isNeedsAttentionView
                ? `${openNeedsAttentionCount} open flags`
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
        {actionMessage ? (
          <p
            className={`admin-action-alert ${/could not|redeploy|failed|error/i.test(actionMessage) ? 'admin-action-alert--error' : 'admin-action-alert--success'}`}
            role="status"
          >
            {actionMessage}
          </p>
        ) : null}

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
        </div>

        <div className="admin-view-tabs" role="tablist" aria-label="Events views">
          {EVENTS_MONITOR_VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={activeView === view.id}
              onClick={() => {
                setActiveView(view.id)
                if (view.id === 'needs-attention') setFlagTypeFilter('all')
              }}
              className={`admin-btn ${activeView === view.id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              {view.label}
              {view.id === 'needs-attention' && openNeedsAttentionCount > 0
                ? ` (${openNeedsAttentionCount})`
                : ''}
              {view.id === 'live' ? ` (${counts.live})` : ''}
              {view.id === 'past' ? ` (${counts.past})` : ''}
            </button>
          ))}
        </div>

        {isNeedsAttentionView ? (
          <div className="admin-needs-attention">
            <AdminNeedsAttentionFilters
              flags={openReviewFlags}
              typeFilter={flagTypeFilter}
              onTypeFilterChange={setFlagTypeFilter}
            />
            {filteredEvents.length === 0 ? (
              <div className="admin-empty">
                <p className="font-medium text-charcoal">Nothing needs attention in this filter.</p>
                <p className="mt-1 text-sm text-muted">
                  Try another flag type, clear search, or refresh from Sheet after edits.
                </p>
              </div>
            ) : (
              <AdminEventsTable
                events={filteredEvents}
                busyId={busyId}
                selectedId={selectedId}
                checkedIds={checkedIds}
                bulkBusy={bulkBusy}
                onSelect={(event) =>
                  setSelectedId((current) => (current === event.id ? null : event.id))
                }
                onToggleChecked={handleToggleChecked}
                onToggleCheckAll={handleToggleCheckAll}
                onClearChecked={() => setCheckedIds([])}
                onBulkApproveVerified={(rows) => void handleBulkApproveVerified(rows)}
                onHide={(event) => void handleHide(event)}
                onSaveAndPublish={(event, edits) => void handleSaveAndPublish(event, edits)}
                onCancel={(event) => void handleCancel(event)}
                onApproveVerified={(event) => void handleApproveVerified(event)}
                duplicateClusters={needsAttentionDuplicateClusters}
                busyClusterId={busyClusterId}
                onKeepWinner={handleKeepWinner}
                reviewFlagsByEventId={needsAttentionFlagsByEventId}
                onDismissFlag={handleDismissFlag}
              />
            )}
          </div>
        ) : (
          <AdminEventsTable
            events={filteredEvents}
            busyId={busyId}
            selectedId={selectedId}
            checkedIds={checkedIds}
            bulkBusy={bulkBusy}
            onSelect={(event) =>
              setSelectedId((current) => (current === event.id ? null : event.id))
            }
            onToggleChecked={handleToggleChecked}
            onToggleCheckAll={handleToggleCheckAll}
            onClearChecked={() => setCheckedIds([])}
            onBulkApproveVerified={(rows) => void handleBulkApproveVerified(rows)}
            onHide={(event) => void handleHide(event)}
            onSaveAndPublish={(event, edits) => void handleSaveAndPublish(event, edits)}
            onCancel={(event) => void handleCancel(event)}
            onApproveVerified={(event) => void handleApproveVerified(event)}
            duplicateClusters={undefined}
            busyClusterId={busyClusterId}
            onKeepWinner={handleKeepWinner}
          />
        )}
      </section>
    </>
  )
}
