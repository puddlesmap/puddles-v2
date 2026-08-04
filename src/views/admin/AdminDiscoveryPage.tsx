import { useMemo, useState } from 'react'
import {
  ALL_DISCOVERY_CANDIDATES,
  DISCOVERY_CATALOG,
  filterDiscoveryCandidates,
  summarizeDiscoveryCounts,
} from '../../data/discovery'
import { AdminDiscoveryTable } from '../../components/admin/AdminDiscoveryTable'
import type { DiscoveryCandidate, DiscoveryEditableFields, DiscoveryViewFilter } from '../../types/discovery'
import { findMatchingEventIdsForCandidate, enrichCandidatesWithSiteVerifiedDates } from '../../utils/discoveryMatchEvents'
import { callSheetApi } from '../../utils/sheetApi'
import {
  applyDiscoveryReviewOverrides,
  editableFieldsFromCandidate,
  loadDiscoveryReviewStore,
  pacificTodayYmd,
  saveDiscoveryReviewRecord,
} from '../../utils/discoveryReview'

type ActionMessage = { type: 'success' | 'error'; text: string }

const VIEW_OPTIONS: { id: DiscoveryViewFilter; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'new', label: 'New only' },
  { id: 'already', label: 'Already on site' },
  { id: 'approved', label: 'Ready' },
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

function deployHint(message: string): string {
  if (/unknown action/i.test(message)) {
    return `${message} Redeploy google-apps-script/PuddlesSheetApi.gs (Deploy → Manage deployments → New version) so Approve / update verified date works.`
  }
  return message
}

async function approveExistingOnSite(
  candidate: DiscoveryCandidate,
  edits: DiscoveryEditableFields,
  lastChecked: string,
): Promise<{ eventId: string }> {
  const matchedIds = findMatchingEventIdsForCandidate({
    ...candidate,
    ...edits,
  })

  if (matchedIds.length > 0) {
    let primaryId = matchedIds[0]
    for (const id of matchedIds) {
      const result = await callSheetApi<{ eventId: string | null; verifiedDate: string }>({
        action: 'updateEventVerifiedDate',
        payload: {
          id,
          verifiedDate: lastChecked,
          discoveryId: candidate.id,
        },
      })
      primaryId = result.eventId || id
    }
    return { eventId: primaryId }
  }

  // Fall back to Sheet-side URL match when local catalog IDs are missing.
  const result = await callSheetApi<{
    eventId: string | null
    eventIds?: string[]
    verifiedDate: string
  }>({
    action: 'updateEventVerifiedDate',
    payload: {
      eventUrl: edits.eventUrl || candidate.eventUrl,
      date: edits.date || candidate.date,
      verifiedDate: lastChecked,
      discoveryId: candidate.id,
    },
  })

  const eventId = result.eventId || result.eventIds?.[0]
  if (!eventId) {
    throw new Error(
      'Could not find the matching Events row to update. Refresh Events from Sheet, then try again.',
    )
  }
  return { eventId }
}

async function approveAsNewDraft(
  candidate: DiscoveryCandidate,
  edits: DiscoveryEditableFields,
  lastChecked: string,
): Promise<{ eventId: string }> {
  const result = await callSheetApi<{ eventId: string; status: string }>({
    action: 'appendEventDraft',
    payload: {
      discoveryId: candidate.id,
      title: edits.title,
      description: edits.description,
      tips: edits.tips,
      venue: edits.venue,
      room: edits.room,
      address: edits.address,
      city: edits.city,
      date: edits.date,
      startTime: edits.startTime,
      endTime: edits.endTime,
      ageRange: edits.ageRange,
      types: edits.types,
      cost: edits.cost,
      eventUrl: edits.eventUrl,
      imageUrl: edits.imageUrl,
      verifiedDate: lastChecked,
      lat: candidate.lat,
      lng: candidate.lng,
      source: candidate.source || 'Discovery',
    },
  })
  return { eventId: result.eventId }
}

export function AdminDiscoveryPage() {
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>(() =>
    enrichCandidatesWithSiteVerifiedDates(
      applyDiscoveryReviewOverrides(ALL_DISCOVERY_CANDIDATES, loadDiscoveryReviewStore()),
    ),
  )
  const [view, setView] = useState<DiscoveryViewFilter>('pending')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null)

  const counts = useMemo(() => summarizeDiscoveryCounts(candidates), [candidates])

  const filtered = useMemo(
    () => filterDiscoveryCandidates(candidates, { view, search }),
    [candidates, view, search],
  )

  function persistCandidate(
    next: DiscoveryCandidate,
    edits?: DiscoveryEditableFields,
    approvedOn?: string,
  ) {
    saveDiscoveryReviewRecord(next.id, {
      reviewStatus: next.reviewStatus,
      convertedEventId: next.convertedEventId || undefined,
      edits,
      ...(approvedOn ? { approvedOn } : next.lastChecked ? { approvedOn: next.lastChecked } : {}),
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
    setActionMessage({
      type: 'success',
      text: 'Edits saved on this device.',
    })
  }

  async function handleApprove(candidate: DiscoveryCandidate, edits: DiscoveryEditableFields) {
    const lastChecked = pacificTodayYmd()
    const payloadEdits = { ...edits, lastChecked }
    const isExisting = candidate.alreadyOnPuddles

    if (isExisting) {
      const ok = window.confirm(
        [
          `“${edits.title}” is already on Puddles.`,
          `Approve will update Last Checked / Verified date to ${lastChecked} (not add a duplicate Draft).`,
        ].join('\n\n'),
      )
      if (!ok) return
    }

    setBusyId(candidate.id)
    setActionMessage({
      type: 'success',
      text: isExisting
        ? `Updating verified date for “${edits.title}”…`
        : `Approving “${edits.title}” as Draft…`,
    })
    try {
      const result = isExisting
        ? await approveExistingOnSite(candidate, payloadEdits, lastChecked)
        : await approveAsNewDraft(candidate, payloadEdits, lastChecked)

      if (!isExisting && !result.eventId) {
        throw new Error(
          'Sheet approved the request but returned no Event ID. Redeploy PuddlesSheetApi.gs (New version) and try again.',
        )
      }

      const next = mergeCandidate(candidate, payloadEdits, {
        reviewStatus: 'approved',
        convertedEventId: result.eventId || candidate.convertedEventId || '',
        lastChecked,
      })
      updateCandidate(candidate.id, () => next)
      persistCandidate(next, payloadEdits, lastChecked)
      setSelectedId(null)
      setView('approved')
      setActionMessage({
        type: 'success',
        text: isExisting
          ? `Ready — Approved on ${lastChecked} for “${edits.title}” (Event ${result.eventId}). Open Events → Refresh from Sheet to confirm Last checked.`
          : `Ready — “${edits.title}” added as Draft (${result.eventId}). Approved on ${lastChecked}. You’re on the Ready filter now.`,
      })
      requestAnimationFrame(() => {
        document.getElementById('admin-discovery-action-message')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not approve discovery candidate.'
      setActionMessage({
        type: 'error',
        text: deployHint(message),
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleBulkApprove(rows: DiscoveryCandidate[]) {
    if (rows.length > 25) {
      const ok = window.confirm(
        `You’re approving ${rows.length} items.\n\nLarge batches can time out the Google Sheet connection. Continue?\n\nTip: batches of ~15–25 are more reliable.`,
      )
      if (!ok) return
    }

    setBulkBusy(true)
    setActionMessage(null)
    let okCount = 0
    let updatedExisting = 0
    let failMessage = ''
    const lastChecked = pacificTodayYmd()

    const existing = rows.filter((row) => row.alreadyOnPuddles)
    const neu = rows.filter((row) => !row.alreadyOnPuddles)

    // Already on site: one (or few) batch Sheet calls instead of one request per row.
    if (existing.length > 0) {
      const idByCandidate = new Map<string, string>()
      const allIds: string[] = []
      for (const candidate of existing) {
        const ids = findMatchingEventIdsForCandidate(candidate)
        if (ids.length === 0) {
          failMessage = `Could not match “${candidate.title}” to an Events row. Refresh Events from Sheet, then retry that item.`
          break
        }
        idByCandidate.set(candidate.id, ids[0])
        for (const id of ids) {
          if (!allIds.includes(id)) allIds.push(id)
        }
      }

      if (!failMessage && allIds.length > 0) {
        const CHUNK = 40
        try {
          for (let i = 0; i < allIds.length; i += CHUNK) {
            const chunk = allIds.slice(i, i + CHUNK)
            await callSheetApi({
              action: 'bulkUpdateEventVerifiedDate',
              payload: { ids: chunk, verifiedDate: lastChecked },
            })
            if (i + CHUNK < allIds.length) {
              await new Promise((r) => setTimeout(r, 400))
            }
          }
          for (const candidate of existing) {
            const eventId = idByCandidate.get(candidate.id) || ''
            const payloadEdits = { ...editableFieldsFromCandidate(candidate), lastChecked }
            const next = mergeCandidate(candidate, payloadEdits, {
              reviewStatus: 'approved',
              convertedEventId: eventId,
              lastChecked,
            })
            updateCandidate(candidate.id, () => next)
            persistCandidate(next, payloadEdits, lastChecked)
            okCount += 1
            updatedExisting += 1
          }
        } catch (error) {
          failMessage =
            error instanceof Error ? error.message : 'Could not update verified dates in bulk.'
        }
      }
    }

    // New candidates: still one Draft append each, with a short pause to avoid timeouts.
    if (!failMessage) {
      for (let i = 0; i < neu.length; i++) {
        const candidate = neu[i]
        const payloadEdits = { ...editableFieldsFromCandidate(candidate), lastChecked }
        try {
          const result = await approveAsNewDraft(candidate, payloadEdits, lastChecked)
          const next = mergeCandidate(candidate, payloadEdits, {
            reviewStatus: 'approved',
            convertedEventId: result.eventId,
            lastChecked,
          })
          updateCandidate(candidate.id, () => next)
          persistCandidate(next, payloadEdits, lastChecked)
          okCount += 1
          if (i < neu.length - 1) {
            await new Promise((r) => setTimeout(r, 350))
          }
        } catch (error) {
          failMessage =
            error instanceof Error ? error.message : 'Could not approve one or more candidates.'
          break
        }
      }
    }

    setBulkBusy(false)
    setSelectedId(null)
    if (okCount > 0) setView('approved')
    if (okCount > 0 && !failMessage) {
      setActionMessage({
        type: 'success',
        text: `Marked ${okCount} Ready (updated verified on ${updatedExisting} already on site). Approved on ${lastChecked}. Refresh Events from Sheet to see Drafts.`,
      })
    } else if (okCount > 0 && failMessage) {
      setActionMessage({
        type: 'error',
        text: `Approved ${okCount}, then stopped: ${deployHint(failMessage)}`,
      })
    } else {
      setActionMessage({
        type: 'error',
        text: deployHint(failMessage || 'Could not approve selected events.'),
      })
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
          Library discovery candidates for review. <strong>Approve</strong> on a <em>new</em> event
          adds a <strong>Draft</strong> on the Events sheet (status becomes <strong>Ready</strong> here).
          On an event already on Puddles it updates <strong>Last Checked Date</strong>. Then open{' '}
          <strong>Events → Refresh from Sheet</strong>, set Published, and <strong>Publish to site</strong>.
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
            <div className="admin-stat-label">Ready</div>
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
            id="admin-discovery-action-message"
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
          bulkBusy={bulkBusy}
          onSelect={handleSelect}
          onSaveEdits={handleSaveEdits}
          onApprove={handleApprove}
          onBulkApprove={(rows) => void handleBulkApprove(rows)}
          onDismiss={handleDismiss}
          onRestore={handleRestore}
        />
      </section>
    </>
  )
}
