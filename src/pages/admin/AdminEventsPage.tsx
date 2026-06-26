import { useMemo, useState } from 'react'
import { ALL_EVENTS } from '../../data/events'
import { AdminEventsTable } from '../../components/admin/AdminEventsTable'
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
import { downloadRowsAsCsv } from '../../utils/exportCsv'
import { EVENT_EXPORT_COLUMNS, exportFilename } from '../../utils/adminExport'
import { enrichPublishingFields } from '../../utils/publishing'
import { callSheetApi } from '../../utils/sheetApi'
import {
  loadCachedAdminRefresh,
  refreshEventsFromSheet,
  saveCachedAdminRefresh,
} from '../../utils/sheetSync'

const CITIES = ['All cities', 'Palo Alto', 'Los Altos', 'Mountain View'] as const

function getInitialEvents(): Event[] {
  const cached = loadCachedAdminRefresh()
  return cached?.events ?? ALL_EVENTS
}

export function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>(getInitialEvents)
  const [adminRefreshedAt, setAdminRefreshedAt] = useState<string | null>(() => {
    return loadCachedAdminRefresh()?.refreshedAt ?? null
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<AdminEventViewId | 'all'>('live')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState<(typeof CITIES)[number]>('All cities')

  const counts = useMemo(() => summarizePublishingCounts(events), [events])
  const viewMeta = activeView === 'all' ? null : getAdminEventView(activeView)

  const filteredEvents = useMemo(() => {
    const base = activeView === 'all' ? events : filterAdminEventsByView(events, activeView)
    return filterAdminEvents(base, {
      search,
      city: city === 'All cities' ? 'all' : city,
    }).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
  }, [events, activeView, search, city])

  async function handleRefresh() {
    setIsRefreshing(true)
    setRefreshError(null)
    setActionMessage(null)
    try {
      const result = await refreshEventsFromSheet()
      setEvents(result.events)
      setAdminRefreshedAt(result.refreshedAt)
      saveCachedAdminRefresh(result)
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

  async function handleHide(event: Event) {
    const confirmed = window.confirm(
      `Hide “${event.title}” from the public site?\n\nThis sets Status to Hidden in the Events tab. You can restore it from the sheet later.`,
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
      />

      <AdminOverview counts={counts} activeView={activeView} onSelectView={setActiveView} />

      <section className="admin-events-section">
        <div className="admin-events-header">
          <div>
            <h2 className="font-display text-lg text-charcoal">{viewMeta?.label ?? 'All events'}</h2>
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
        {actionMessage && <p className="admin-export-message">{actionMessage}</p>}

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

        <div className="admin-view-tabs" role="tablist" aria-label="Saved views">
          {ADMIN_EVENT_VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={activeView === view.id}
              onClick={() => setActiveView(view.id)}
              className={`admin-btn ${activeView === view.id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              {view.label}
            </button>
          ))}
        </div>

        <AdminEventsTable
          events={filteredEvents}
          busyId={busyId}
          selectedId={selectedId}
          onSelect={(event) =>
            setSelectedId((current) => (current === event.id ? null : event.id))
          }
          onHide={handleHide}
        />
      </section>
    </>
  )
}
