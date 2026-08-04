import { useEffect, useMemo, useState } from 'react'
import { ALL_EVENTS } from '../../data/events'
import { SYNC_META } from '../../data/syncInfo'
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
import { pacificTodayYmd } from '../../utils/discoveryReview'
import { callSheetApi } from '../../utils/sheetApi'
import {
  resolveAdminEventsSource,
  refreshEventsFromSheet,
  saveCachedAdminRefresh,
} from '../../utils/sheetSync'
import { triggerPublishToSite } from '../../utils/triggerPublish'

const CITIES = ['All cities', 'Palo Alto', 'Los Altos', 'Mountain View'] as const
const REVIEW_EMAIL_NOTICE_KEY = 'puddles-admin-review-email-fingerprint'
const DISMISSED_FLAGS_KEY = 'puddles-admin-dismissed-review-flags'

function getInitialAdminState(): { events: Event[]; refreshedAt: string | null } {
  const resolved = resolveAdminEventsSource(ALL_EVENTS, SYNC_META.syncedAt)
  return { events: resolved.events, refreshedAt: resolved.refreshedAt }
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
  const [busyFlagId, setBusyFlagId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const [activeView, setActiveView] = useState<AdminEventViewId | 'all'>('live')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState<(typeof CITIES)[number]>('All cities')
  const [flagTypeFilter, setFlagTypeFilter] = useState<'all' | AdminReviewFlagType>('all')
  const [dismissedFlagIds, setDismissedFlagIds] = useState<Set<string>>(loadDismissedFlagIds)

  useEffect(() => {
    setCheckedIds([])
  }, [activeView, search, city])

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
    let okCount = 0
    let failMessage = ''
    const succeededIds = new Set<string>()

    for (const event of rows) {
      try {
        await callSheetApi({
          action: 'updateEventVerifiedDate',
          payload: { id: event.id, verifiedDate: approvedOn },
        })
        succeededIds.add(event.id)
        okCount += 1
      } catch (error) {
        failMessage = error instanceof Error ? error.message : 'Could not approve one or more events.'
        break
      }
    }

    if (succeededIds.size > 0) {
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
    }

    setCheckedIds([])
    setBulkBusy(false)

    if (okCount > 0 && !failMessage) {
      setActionMessage(
        `Approved ${okCount} event${okCount === 1 ? '' : 's'} — Approved on ${approvedOn}.`,
      )
    } else if (okCount > 0 && failMessage) {
      setActionMessage(`Approved ${okCount}, then stopped: ${failMessage}`)
    } else {
      const needsDeploy = /unknown action/i.test(failMessage)
      setActionMessage(
        needsDeploy
          ? `${failMessage} Redeploy google-apps-script/PuddlesSheetApi.gs (New version) so Approve can update Last Checked Date.`
          : failMessage || 'Could not approve selected events.',
      )
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
        {actionMessage ? (
          <p
            className={`admin-action-alert ${/could not|redeploy|failed|error/i.test(actionMessage) ? 'admin-action-alert--error' : 'admin-action-alert--success'}`}
            role="status"
          >
            {actionMessage}
          </p>
        ) : null}

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
            onApproveVerified={(event) => void handleApproveVerified(event)}
            duplicateClusters={isDuplicatesView ? visibleClusters : undefined}
            busyClusterId={busyClusterId}
            onKeepWinner={handleKeepWinner}
          />
        )}
      </section>
    </>
  )
}
