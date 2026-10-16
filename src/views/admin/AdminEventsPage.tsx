import { useEffect, useMemo, useState } from 'react'
import { AdminEventsTable } from '../../components/admin/AdminEventsTable'
import { AdminOverview } from '../../components/admin/AdminOverview'
import { AdminSyncBar } from '../../components/admin/AdminSyncBar'
import type { AdminEventCatalog, AdminEventViewId } from '../../types/admin'
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
} from '../../utils/adminReviewFlags'
import {
  eventMatchesCatalog,
  seasonalLiveMonitor,
} from '../../utils/adminSeasonalEvents'
import { downloadRowsAsCsv } from '../../utils/exportCsv'
import { EVENT_EXPORT_COLUMNS, exportFilename } from '../../utils/adminExport'
import { enrichPublishingFields } from '../../utils/publishing'
import { syncReadyDiscoveryIntoAdminCache } from '../../utils/discoveryApproveLocal'
import { editableFieldsFromEvent, prepareEventForPublish } from '../../utils/adminEventEdit'
import { stageAdminEvent } from '../../utils/adminPublishQueue'
import type { AdminEventEditableFields } from '../../types/adminEventEdit'
import { callSheetApi } from '../../utils/sheetApi'
import {
  refreshEventsFromSheet,
  saveCachedAdminRefresh,
} from '../../utils/sheetSync'
import { triggerPublishToSite } from '../../utils/triggerPublish'

const CITIES = ['All cities', 'Palo Alto', 'Los Altos', 'Mountain View', 'Sunnyvale'] as const
const REVIEW_EMAIL_NOTICE_KEY = 'puddles-admin-review-email-fingerprint'
const EVENTS_MONITOR_VIEWS = ADMIN_EVENT_VIEWS.filter((view) =>
  view.id === 'live' || view.id === 'past',
)

const LIVE_VIEW_COPY: Record<AdminEventCatalog, { description: string }> = {
  regular: {
    description:
      'Everyday Browse in Palo Alto, Los Altos, Mountain View, and Sunnyvale. Already on the public site and not past.',
  },
  seasonal: {
    description:
      'Every collection on Home today, close to home and worth a little drive, in one list. Already on the public site and not past. Hidden regional stays off regular Browse.',
  },
}

const CATALOG_NOTE: Record<AdminEventCatalog, string> = {
  regular: 'Everyday Browse in Palo Alto, Los Altos, Mountain View, and Sunnyvale.',
  seasonal:
    'Seasonal home collections and farther worth-a-little-drive outings. Live adds every collection on Home today into one list.',
}

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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<AdminEventViewId | 'all'>('live')
  const [catalog, setCatalog] = useState<AdminEventCatalog>('regular')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState<(typeof CITIES)[number]>('All cities')

  useEffect(() => {
    function reloadFromDiscoveryReady() {
      const synced = syncReadyDiscoveryIntoAdminCache()
      if (
        synced.draftsAdded === 0 &&
        synced.verifiedUpdated === 0 &&
        (synced.draftsRemoved ?? 0) === 0 &&
        (synced.readyPromoted ?? 0) === 0 &&
        (synced.pendingPromoted ?? 0) === 0
      ) {
        return
      }
      setEvents(synced.events.map((event) => enrichPublishingFields(event)))
      setAdminRefreshedAt(new Date().toISOString())
      if ((synced.draftsRemoved ?? 0) > 0 || (synced.readyPromoted ?? 0) > 0 || (synced.pendingPromoted ?? 0) > 0) {
        const parts: string[] = []
        if ((synced.draftsRemoved ?? 0) > 0) {
          parts.push(
            `cleared ${synced.draftsRemoved} Draft${synced.draftsRemoved === 1 ? '' : 's'} already Live`,
          )
        }
        if ((synced.readyPromoted ?? 0) > 0) {
          parts.push(`promoted ${synced.readyPromoted} Ready → Live`)
        }
        if ((synced.pendingPromoted ?? 0) > 0) {
          parts.push(`promoted ${synced.pendingPromoted} Pending → Live`)
        }
        setActionMessage(parts.join(' · '))
      }
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
    setSelectedId(null)
  }, [activeView, catalog, search, city])

  const counts = useMemo(() => summarizePublishingCounts(events, catalog), [events, catalog])
  const seasonalLive = useMemo(
    () => (catalog === 'seasonal' ? seasonalLiveMonitor(events) : null),
    [catalog, events],
  )
  const viewMeta = useMemo(() => {
    if (activeView === 'all') return null
    const base = getAdminEventView(activeView)
    if (!base) return null
    if (activeView === 'live') {
      return { ...base, description: LIVE_VIEW_COPY[catalog].description }
    }
    return base
  }, [activeView, catalog])

  const filteredEvents = useMemo(() => {
    const base =
      activeView === 'all'
        ? events.filter((event) => eventMatchesCatalog(event, catalog))
        : filterAdminEventsByView(events, activeView, catalog)
    return filterAdminEvents(base, {
      search,
      city: city === 'All cities' ? 'all' : city,
    }).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
  }, [events, activeView, catalog, search, city])

  const overviewCounts = useMemo(
    () => ({
      live: counts.live,
      past: counts.past,
    }),
    [counts.live, counts.past],
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
        'It can overwrite approved Admin edits (descriptions, types, tips).\n\n' +
        'Use the Admin header Publish for normal publishing.\n\nContinue?',
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
      const edits = editableFieldsFromEvent(event)
      edits.status = 'Cancelled'
      if (!edits.tips.trim()) edits.tips = 'This activity was cancelled.'
      const published = prepareEventForPublish(event, edits)
      stageAdminEvent(published, 'events', event.id)
      setEvents((current) => {
        const next = current.map((row) => (row.id === event.id ? published : row))
        saveCachedAdminRefresh({ events: next, refreshedAt: new Date().toISOString() })
        return next
      })
      setAdminRefreshedAt(new Date().toISOString())
      setActionMessage('Cancellation approved. Use Publish in the Admin header to update the site.')
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not cancel event.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleSaveAndPublish(event: Event, edits: AdminEventEditableFields) {
    setBusyId(event.id)
    setActionMessage(null)
    try {
      const published = prepareEventForPublish(event, edits)
      stageAdminEvent(published, 'events', event.id)
      setEvents((current) => {
        const exists = current.some((row) => row.id === event.id)
        const next = exists
          ? current.map((row) => (row.id === event.id ? published : row))
          : [...current, published]
        saveCachedAdminRefresh({ events: next, refreshedAt: new Date().toISOString() })
        return next
      })
      setAdminRefreshedAt(new Date().toISOString())
      setActionMessage(`Approved changes to “${published.title}”. Use Publish in the Admin header when ready.`)
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not approve these changes.')
    } finally {
      setBusyId(null)
    }
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
      const edits = editableFieldsFromEvent(event)
      edits.status = 'Hidden'
      const hidden = prepareEventForPublish(event, edits)
      stageAdminEvent(hidden, 'events', event.id)
      setEvents((current) => {
        const next = current.map((row) => (row.id === event.id ? hidden : row))
        saveCachedAdminRefresh({ events: next, refreshedAt: new Date().toISOString() })
        return next
      })
      setActionMessage(`Removal approved for “${event.title}”. Use Publish to update the site.`)
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not hide event.')
    } finally {
      setBusyId(null)
    }
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

      <div
        className="admin-discovery-mode-toggle admin-events-catalog-toggle"
        role="tablist"
        aria-label="Event catalog"
      >
        <button
          type="button"
          role="tab"
          aria-selected={catalog === 'regular'}
          className={`admin-btn ${catalog === 'regular' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setCatalog('regular')}
        >
          Regular
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={catalog === 'seasonal'}
          className={`admin-btn ${catalog === 'seasonal' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setCatalog('seasonal')}
        >
          Regional / Seasonal
        </button>
      </div>
      <p className="admin-events-catalog-note">{CATALOG_NOTE[catalog]}</p>

      <AdminOverview
        catalog={catalog}
        counts={overviewCounts}
        activeView={activeView}
        onSelectView={setActiveView}
      />

      <section className="admin-events-section">
        <div className="admin-events-header">
          <div>
            <h2 className="font-display text-lg text-charcoal">{viewMeta?.label ?? 'Events'}</h2>
            {viewMeta?.description && <p className="mt-1 text-sm text-muted">{viewMeta.description}</p>}
          </div>
          <div className="admin-events-header-actions">
            <div className="text-sm text-muted">{filteredEvents.length} shown</div>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={handleExportCsv}>
              Export filtered CSV
            </button>
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
              onClick={() => setActiveView(view.id)}
              className={`admin-btn ${activeView === view.id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              {view.label}
              {view.id === 'live' ? ` (${counts.live})` : ''}
              {view.id === 'past' ? ` (${counts.past})` : ''}
            </button>
          ))}
        </div>

        {activeView === 'live' && seasonalLive && seasonalLive.missingIds.length > 0 && city === 'All cities' ? (
          <ul className="admin-seasonal-missing">
            {seasonalLive.missingIds
              .filter((id) => id.toLowerCase().includes(search.trim().toLowerCase()))
              .map((id) => (
                <li key={id}>
                  <span>Not in the catalog</span>
                  <code>{id}</code>
                </li>
              ))}
          </ul>
        ) : null}

        <AdminEventsTable
          events={filteredEvents}
          busyId={busyId}
          selectedId={selectedId}
          onSelect={(event) =>
            setSelectedId((current) => (current === event.id ? null : event.id))
          }
          onHide={(event) => void handleHide(event)}
          onSaveAndPublish={(event, edits) => void handleSaveAndPublish(event, edits)}
          onCancel={(event) => void handleCancel(event)}
        />
      </section>
    </>
  )
}
