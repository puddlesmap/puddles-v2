import { useMemo, useState } from 'react'
import {
  ALL_DISCOVERY_CANDIDATES,
  DISCOVERY_CATALOG,
  filterDiscoveryCandidates,
  summarizeDiscoveryCounts,
} from '../../data/discovery'
import { AdminDiscoveryTable } from '../../components/admin/AdminDiscoveryTable'
import type { DiscoveryCandidate, DiscoveryEditableFields, DiscoveryViewFilter } from '../../types/discovery'
import { callSheetApi } from '../../utils/sheetApi'
import {
  applyDiscoveryReviewOverrides,
  loadDiscoveryReviewStore,
  pacificTodayYmd,
  saveDiscoveryReviewRecord,
} from '../../utils/discoveryReview'

type ActionMessage = { type: 'success' | 'error'; text: string }

const VIEW_OPTIONS: { id: DiscoveryViewFilter; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'new', label: 'New only' },
  { id: 'already', label: 'Already on site' },
  { id: 'approved', label: 'Approved' },
  { id: 'dismissed', label: 'Dismissed' },
  { id: 'all', label: 'All' },
]

function mergeCandidate(
  candidate: DiscoveryCandidate,
  edits: DiscoveryEditableFields,
  extras: Partial<DiscoveryCandidate> = {},
): DiscoveryCandidate {
  return {
    ...candidate,
    ...edits,
    ...extras,
  }
}

export function AdminDiscoveryPage() {
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>(() =>
    applyDiscoveryReviewOverrides(ALL_DISCOVERY_CANDIDATES, loadDiscoveryReviewStore()),
  )
  const [view, setView] = useState<DiscoveryViewFilter>('pending')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null)

  const counts = useMemo(() => summarizeDiscoveryCounts(candidates), [candidates])

  const filtered = useMemo(
    () => filterDiscoveryCandidates(candidates, { view, search }),
    [candidates, view, search],
  )

  function persistCandidate(next: DiscoveryCandidate, edits?: DiscoveryEditableFields) {
    saveDiscoveryReviewRecord(next.id, {
      reviewStatus: next.reviewStatus,
      convertedEventId: next.convertedEventId || undefined,
      edits,
      updatedAt: new Date().toISOString(),
    })
  }

  function updateCandidate(id: string, updater: (current: DiscoveryCandidate) => DiscoveryCandidate) {
    setCandidates((current) => current.map((row) => (row.id === id ? updater(row) : row)))
  }

  function handleSelect(candidate: DiscoveryCandidate) {
    setSelectedId((current) => (current === candidate.id ? null : candidate.id))
    setActionMessage(null)
  }

  function handleSaveEdits(candidate: DiscoveryCandidate, edits: DiscoveryEditableFields) {
    const next = mergeCandidate(candidate, edits)
    updateCandidate(candidate.id, () => next)
    persistCandidate(next, edits)
    setActionMessage({ type: 'success', text: 'Edits saved on this device.' })
  }

  async function handleApprove(candidate: DiscoveryCandidate, edits: DiscoveryEditableFields) {
    if (candidate.alreadyOnPuddles) {
      const ok = window.confirm(
        `“${edits.title}” looks like it’s already on Puddles.\n\nApprove anyway as a new Draft?`,
      )
      if (!ok) return
    }

    const lastChecked = edits.lastChecked || pacificTodayYmd()
    const payloadEdits = { ...edits, lastChecked }
    setBusyId(candidate.id)
    setActionMessage(null)
    try {
      const result = await callSheetApi<{ eventId: string; status: string }>({
        action: 'appendEventDraft',
        payload: {
          discoveryId: candidate.id,
          title: payloadEdits.title,
          description: payloadEdits.description,
          tips: payloadEdits.tips,
          venue: payloadEdits.venue,
          room: payloadEdits.room,
          address: payloadEdits.address,
          city: payloadEdits.city,
          date: payloadEdits.date,
          startTime: payloadEdits.startTime,
          endTime: payloadEdits.endTime,
          ageRange: payloadEdits.ageRange,
          types: payloadEdits.types,
          cost: payloadEdits.cost,
          eventUrl: payloadEdits.eventUrl,
          imageUrl: payloadEdits.imageUrl,
          verifiedDate: lastChecked,
          lat: candidate.lat,
          lng: candidate.lng,
          source: candidate.source || 'Discovery',
        },
      })

      const next = mergeCandidate(candidate, payloadEdits, {
        reviewStatus: 'approved',
        convertedEventId: result.eventId,
        lastChecked,
      })
      updateCandidate(candidate.id, () => next)
      persistCandidate(next, payloadEdits)
      setSelectedId(null)
      setActionMessage({
        type: 'success',
        text: `Approved as Draft (Event ID: ${result.eventId}). Refresh Events from Sheet to see it, then Publish when ready.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not approve discovery candidate.'
      const needsDeploy = /unknown action/i.test(message)
      setActionMessage({
        type: 'error',
        text: needsDeploy
          ? `${message} Redeploy google-apps-script/PuddlesSheetApi.gs (new action: appendEventDraft).`
          : message,
      })
    } finally {
      setBusyId(null)
    }
  }

  function handleDismiss(candidate: DiscoveryCandidate) {
    const next = { ...candidate, reviewStatus: 'dismissed' as const }
    updateCandidate(candidate.id, () => next)
    persistCandidate(next)
    setSelectedId((current) => (current === candidate.id ? null : current))
    setActionMessage({ type: 'success', text: 'Dismissed from the pending queue.' })
  }

  function handleRestore(candidate: DiscoveryCandidate) {
    const next = { ...candidate, reviewStatus: 'pending' as const }
    updateCandidate(candidate.id, () => next)
    persistCandidate(next)
    setActionMessage({ type: 'success', text: 'Restored to pending.' })
  }

  return (
    <>
      <section className="admin-sync-bar" aria-label="Discovery overview">
        <p className="admin-submissions-intro">
          Library discovery candidates for review. Edit content and Good to know, set{' '}
          <strong>Last checked</strong>, then <strong>Approve → Draft</strong> on the Events sheet.
          Publish from Events when ready.
        </p>
        <div className="admin-stat-grid admin-stat-grid-compact">
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.pending}</div>
            <div className="admin-stat-label">Pending</div>
          </div>
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.newPending}</div>
            <div className="admin-stat-label">New</div>
          </div>
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.alreadyPending}</div>
            <div className="admin-stat-label">Already on site</div>
          </div>
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.approved}</div>
            <div className="admin-stat-label">Approved</div>
          </div>
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.dismissed}</div>
            <div className="admin-stat-label">Dismissed</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          Queue: {DISCOVERY_CATALOG.window.start} → {DISCOVERY_CATALOG.window.end} · generated{' '}
          {DISCOVERY_CATALOG.generatedAt
            ? new Date(DISCOVERY_CATALOG.generatedAt).toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
              })
            : '—'}
          . Refresh with <code>npm run discover:palo-alto</code>. Review status is saved in this
          browser.
        </p>
        {actionMessage ? (
          <p
            className={`admin-action-alert admin-action-alert--${actionMessage.type}`}
            role="status"
          >
            {actionMessage.text}
          </p>
        ) : null}
      </section>

      <section className="admin-events-section">
        <div className="admin-events-header">
          <div>
            <h2 className="font-display text-lg text-charcoal">Discovery queue</h2>
            <p className="mt-1 text-sm text-muted">{filtered.length} shown</p>
          </div>
        </div>

        <div className="admin-toolbar">
          <label className="admin-search">
            <span className="sr-only">Search discovery</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, venue, tips…"
              className="admin-search-input"
            />
          </label>
        </div>

        <div className="admin-view-tabs" role="tablist" aria-label="Discovery views">
          {VIEW_OPTIONS.map((option) => {
            const count =
              option.id === 'pending'
                ? counts.pending
                : option.id === 'new'
                  ? counts.newPending
                  : option.id === 'already'
                    ? counts.alreadyPending
                    : option.id === 'approved'
                      ? counts.approved
                      : option.id === 'dismissed'
                        ? counts.dismissed
                        : counts.total
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={view === option.id}
                className={`admin-btn ${view === option.id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={() => setView(option.id)}
              >
                {option.label} ({count})
              </button>
            )
          })}
        </div>

        <AdminDiscoveryTable
          candidates={filtered}
          selectedId={selectedId}
          busyId={busyId}
          onSelect={handleSelect}
          onSaveEdits={handleSaveEdits}
          onApprove={handleApprove}
          onDismiss={handleDismiss}
          onRestore={handleRestore}
        />
      </section>
    </>
  )
}
