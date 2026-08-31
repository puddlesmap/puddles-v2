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
import {
  approveDiscoveryLocally,
  assertDiscoveryAgeInScope,
  ensureAdminEventsCacheSeeded,
  loadWriteSheetPreference,
  prepareGoLiveEvents,
  saveWriteSheetPreference,
} from '../../utils/discoveryApproveLocal'
import { publishEventsToSite } from '../../utils/publishEvents'
import { callSheetApi } from '../../utils/sheetApi'
import {
  applyDiscoveryReviewOverrides,
  editableFieldsFromCandidate,
  loadDiscoveryReviewStore,
  pacificTodayYmd,
  saveDiscoveryReviewRecord,
} from '../../utils/discoveryReview'
import { summarizeDiscoveryThisWeek } from '../../utils/discoveryThisWeek'

type ActionMessage = { type: 'success' | 'error'; text: string }

const VIEW_OPTIONS: { id: DiscoveryViewFilter; label: string }[] = [
  { id: 'thisWeek', label: 'This week' },
  { id: 'pending', label: 'Pending' },
  { id: 'new', label: 'New only' },
  { id: 'already', label: 'Already on site' },
  { id: 'approved', label: 'Ready' },
  { id: 'live', label: 'Live' },
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
    return `${message} Redeploy google-apps-script/PuddlesSheetApi.gs (Deploy → Manage deployments → New version) so Sheet write works.`
  }
  return message
}

async function writeExistingToSheet(
  candidate: DiscoveryCandidate,
  edits: DiscoveryEditableFields,
  lastChecked: string,
  preferredEventId?: string,
): Promise<string> {
  const matchedIds = findMatchingEventIdsForCandidate({
    ...candidate,
    ...edits,
  })
  const ids = matchedIds.length > 0 ? matchedIds : preferredEventId ? [preferredEventId] : []

  if (ids.length > 0) {
    let primaryId = ids[0]
    for (const id of ids) {
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
    return primaryId
  }

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
    throw new Error('Sheet could not find a matching Events row to update.')
  }
  return eventId
}

async function writeNewDraftToSheet(
  candidate: DiscoveryCandidate,
  edits: DiscoveryEditableFields,
  lastChecked: string,
): Promise<string> {
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
  if (!result.eventId) {
    throw new Error('Sheet approved the request but returned no Event ID.')
  }
  return result.eventId
}

export function AdminDiscoveryPage() {
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>(() =>
    enrichCandidatesWithSiteVerifiedDates(
      applyDiscoveryReviewOverrides(ALL_DISCOVERY_CANDIDATES, loadDiscoveryReviewStore()),
    ),
  )
  const [view, setView] = useState<DiscoveryViewFilter>('thisWeek')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [goLiveBusy, setGoLiveBusy] = useState(false)
  const [writeSheet, setWriteSheet] = useState(() => loadWriteSheetPreference())
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null)

  const counts = useMemo(() => summarizeDiscoveryCounts(candidates), [candidates])

  const thisWeekSummary = useMemo(
    () => summarizeDiscoveryThisWeek(candidates, undefined, DISCOVERY_CATALOG.generatedAt),
    [candidates],
  )

  const filtered = useMemo(
    () =>
      filterDiscoveryCandidates(candidates, {
        view,
        search,
        catalogGeneratedAt: DISCOVERY_CATALOG.generatedAt,
      }),
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

  function handleWriteSheetToggle(enabled: boolean) {
    setWriteSheet(enabled)
    saveWriteSheetPreference(enabled)
  }

  async function handleApprove(candidate: DiscoveryCandidate, edits: DiscoveryEditableFields) {
    const lastChecked = pacificTodayYmd()
    const payloadEdits = { ...edits, lastChecked }
    const isExisting = candidate.alreadyOnPuddles

    try {
      assertDiscoveryAgeInScope(candidate, payloadEdits)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Outside Puddles ages 0–5.'
      setActionMessage({ type: 'error', text: message })
      return
    }

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
        ? `Marking Ready and updating verified date for “${edits.title}”…`
        : `Marking Ready and adding Draft for “${edits.title}”…`,
    })

    try {
      ensureAdminEventsCacheSeeded()
      const local = approveDiscoveryLocally(candidate, payloadEdits, lastChecked)

      const next = mergeCandidate(candidate, payloadEdits, {
        reviewStatus: 'approved',
        convertedEventId: local.eventId || candidate.convertedEventId || '',
        lastChecked,
      })
      updateCandidate(candidate.id, () => next)
      persistCandidate(next, payloadEdits, lastChecked)
      setSelectedId(null)
      setView('approved')

      let sheetNote = ''
      if (writeSheet) {
        try {
          const sheetEventId = isExisting
            ? await writeExistingToSheet(candidate, payloadEdits, lastChecked, local.eventId)
            : await writeNewDraftToSheet(candidate, payloadEdits, lastChecked)
          if (sheetEventId && sheetEventId !== local.eventId) {
            const withSheetId = { ...next, convertedEventId: sheetEventId }
            updateCandidate(candidate.id, () => withSheetId)
            persistCandidate(withSheetId, payloadEdits, lastChecked)
          }
          sheetNote = ' Also wrote Google Sheet.'
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sheet write failed.'
          sheetNote = ` Local Ready kept; Sheet write failed: ${deployHint(message)}`
        }
      }

      setActionMessage({
        type: sheetNote.includes('Sheet write failed') ? 'error' : 'success',
        text: isExisting
          ? `Ready — Approved on ${lastChecked} for “${edits.title}” (Event ${local.eventId}). Open Events to confirm Last checked.${sheetNote}`
          : `Ready — “${edits.title}” added as Draft in Admin (${local.eventId}). Approved on ${lastChecked}. Open Events → Drafts.${sheetNote}`,
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
        text: message,
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleBulkApprove(rows: DiscoveryCandidate[]) {
    if (writeSheet && rows.length > 25) {
      const ok = window.confirm(
        `You’re approving ${rows.length} items with “Also write Google Sheet” on.\n\nLarge Sheet batches can time out. Continue?\n\nTip: turn Sheet write off for large batches, or use ~15–25 at a time.`,
      )
      if (!ok) return
    }

    setBulkBusy(true)
    setActionMessage(null)
    let okCount = 0
    let updatedExisting = 0
    let localFail = ''
    let sheetFailMessage = ''
    const lastChecked = pacificTodayYmd()

    ensureAdminEventsCacheSeeded()

    const existing = rows.filter((row) => row.alreadyOnPuddles)
    const neu = rows.filter((row) => !row.alreadyOnPuddles)
    const localEventIds = new Map<string, string>()

    // Local-first: always mark Ready + patch Admin Events cache (no Sheet required).
    for (const candidate of existing) {
      try {
        const payloadEdits = { ...editableFieldsFromCandidate(candidate), lastChecked }
        const local = approveDiscoveryLocally(candidate, payloadEdits, lastChecked)
        localEventIds.set(candidate.id, local.eventId)
        const next = mergeCandidate(candidate, payloadEdits, {
          reviewStatus: 'approved',
          convertedEventId: local.eventId,
          lastChecked,
        })
        updateCandidate(candidate.id, () => next)
        persistCandidate(next, payloadEdits, lastChecked)
        okCount += 1
        updatedExisting += 1
      } catch (error) {
        localFail =
          error instanceof Error ? error.message : 'Could not update one or more already-on-site items.'
        break
      }
    }

    if (!localFail) {
      for (const candidate of neu) {
        try {
          const payloadEdits = { ...editableFieldsFromCandidate(candidate), lastChecked }
          const local = approveDiscoveryLocally(candidate, payloadEdits, lastChecked)
          localEventIds.set(candidate.id, local.eventId)
          const next = mergeCandidate(candidate, payloadEdits, {
            reviewStatus: 'approved',
            convertedEventId: local.eventId,
            lastChecked,
          })
          updateCandidate(candidate.id, () => next)
          persistCandidate(next, payloadEdits, lastChecked)
          okCount += 1
        } catch (error) {
          localFail =
            error instanceof Error ? error.message : 'Could not approve one or more new candidates.'
          break
        }
      }
    }

    // Optional Sheet sync after local Ready (failures do not undo Ready).
    if (writeSheet && okCount > 0) {
      const approvedExisting = existing.filter((row) => localEventIds.has(row.id))
      const approvedNew = neu.filter((row) => localEventIds.has(row.id))

      if (approvedExisting.length > 0) {
        const allIds = [
          ...new Set(
            approvedExisting.flatMap((candidate) => {
              const matched = findMatchingEventIdsForCandidate(candidate)
              return matched.length > 0
                ? matched
                : localEventIds.get(candidate.id)
                  ? [localEventIds.get(candidate.id)!]
                  : []
            }),
          ),
        ]
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
        } catch (error) {
          sheetFailMessage =
            error instanceof Error ? error.message : 'Could not update verified dates on Sheet.'
        }
      }

      if (!sheetFailMessage) {
        for (let i = 0; i < approvedNew.length; i++) {
          const candidate = approvedNew[i]
          const payloadEdits = { ...editableFieldsFromCandidate(candidate), lastChecked }
          try {
            const sheetEventId = await writeNewDraftToSheet(candidate, payloadEdits, lastChecked)
            if (sheetEventId) {
              const next = mergeCandidate(candidate, payloadEdits, {
                reviewStatus: 'approved',
                convertedEventId: sheetEventId,
                lastChecked,
              })
              updateCandidate(candidate.id, () => next)
              persistCandidate(next, payloadEdits, lastChecked)
            }
            if (i < approvedNew.length - 1) {
              await new Promise((r) => setTimeout(r, 350))
            }
          } catch (error) {
            sheetFailMessage =
              error instanceof Error ? error.message : 'Could not write one or more Drafts to Sheet.'
            break
          }
        }
      }
    }

    setBulkBusy(false)
    setSelectedId(null)
    if (okCount > 0) setView('approved')

    if (okCount > 0 && !localFail && !sheetFailMessage) {
      setActionMessage({
        type: 'success',
        text: writeSheet
          ? `Marked ${okCount} Ready (updated verified on ${updatedExisting} already on site). Approved on ${lastChecked}. Also wrote Google Sheet.`
          : `Marked ${okCount} Ready (updated verified on ${updatedExisting} already on site). Approved on ${lastChecked}. Open Events to see Drafts / Last checked.`,
      })
    } else if (okCount > 0 && (localFail || sheetFailMessage)) {
      setActionMessage({
        type: 'error',
        text: localFail
          ? `Marked ${okCount} Ready, then stopped: ${localFail}`
          : `Marked ${okCount} Ready locally. Sheet write issue: ${deployHint(sheetFailMessage)}`,
      })
    } else {
      setActionMessage({
        type: 'error',
        text: localFail || sheetFailMessage || 'Could not approve selected events.',
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

  async function handleGoLive(rows: DiscoveryCandidate[]) {
    const targets = rows.filter((row) => row.reviewStatus === 'approved')
    if (targets.length === 0) {
      setActionMessage({ type: 'error', text: 'Select Ready items to Go live.' })
      return
    }

    const ok = window.confirm(
      `Go live with ${targets.length} activit${targets.length === 1 ? 'y' : 'ies'}?\n\nThey will be Published on the public site (usually updates in 2–4 minutes).`,
    )
    if (!ok) return

    setGoLiveBusy(true)
    setActionMessage({
      type: 'success',
      text: `Going live with ${targets.length}…`,
    })

    try {
      const verifiedDate = pacificTodayYmd()
      const { events, results } = prepareGoLiveEvents(targets, verifiedDate)
      const message = await publishEventsToSite(events)

      for (const result of results) {
        const candidate = targets.find((row) => row.id === result.candidateId)
        if (!candidate) continue
        const edits = editableFieldsFromCandidate(candidate)
        const next = mergeCandidate(
          candidate,
          { ...edits, lastChecked: verifiedDate },
          {
            reviewStatus: 'live',
            convertedEventId: result.eventId,
            lastChecked: verifiedDate,
          },
        )
        updateCandidate(candidate.id, () => next)
        persistCandidate(next, { ...edits, lastChecked: verifiedDate }, verifiedDate)
      }

      setSelectedId(null)
      setView('live')
      setActionMessage({
        type: 'success',
        text: message,
      })
      requestAnimationFrame(() => {
        document.getElementById('admin-discovery-action-message')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      })
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not Go live.',
      })
    } finally {
      setGoLiveBusy(false)
    }
  }

  return (
    <>
      <section className="admin-sync-bar" aria-label="Discovery overview">
        <p className="admin-submissions-intro">
          Review library candidates here. <strong>Approve</strong> → <strong>Ready</strong>, then{' '}
          <strong>Go live</strong> to publish them on the public site (~2–4 min). Events tab monitors
          what is already Live / Needs attention / Past.
        </p>
        <label className="admin-discovery-sheet-toggle">
          <input
            type="checkbox"
            checked={writeSheet}
            onChange={(e) => handleWriteSheetToggle(e.target.checked)}
          />
          <span>
            Also write Google Sheet on Approve (optional). Sheet failures never undo Ready. Go live
            does not need the Sheet.
          </span>
        </label>
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
            <div className="admin-stat-value">{counts.live}</div>
            <div className="admin-stat-label">Live</div>
          </div>
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.dismissed}</div>
            <div className="admin-stat-label">Dismissed</div>
          </div>
        </div>
        {view === 'approved' && counts.approved > 0 ? (
          <div className="admin-discovery-golive-bar">
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={goLiveBusy || bulkBusy}
              onClick={() => void handleGoLive(filtered)}
            >
              {goLiveBusy ? 'Going live…' : `Go live all Ready (${counts.approved})`}
            </button>
            <span className="text-sm text-muted">
              Publishes Ready activities to the public catalog without Google Sheet.
            </span>
          </div>
        ) : null}
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
        {view === 'thisWeek' ? (
          <div className="admin-discovery-this-week">
            <div className="admin-discovery-this-week__head">
              <h2 className="admin-discovery-this-week__title">New to Puddles this week</h2>
              <p className="admin-discovery-this-week__lede">
                {thisWeekSummary.weekStart} → {thisWeekSummary.weekEnd} Pacific ·{' '}
                {thisWeekSummary.total} pending review · queue refreshed{' '}
                {DISCOVERY_CATALOG.generatedAt
                  ? new Date(DISCOVERY_CATALOG.generatedAt).toLocaleString('en-US', {
                      timeZone: 'America/Los_Angeles',
                    })
                  : '—'}
              </p>
            </div>
            {thisWeekSummary.highlights.length > 0 ? (
              <ul className="admin-discovery-this-week__highlights">
                {thisWeekSummary.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
            <div className="admin-discovery-this-week__grid">
              <div className="admin-discovery-this-week__panel">
                <h3 className="admin-discovery-this-week__label">New cities</h3>
                <ul className="admin-discovery-this-week__list">
                  {thisWeekSummary.launchCities.map((entry) => (
                    <li key={entry.city}>
                      <strong>{entry.city}</strong> · {entry.count} this week
                      <span className="admin-discovery-this-week__meta">
                        NEW filter until {entry.newUntil}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-discovery-this-week__panel">
                <h3 className="admin-discovery-this-week__label">New activity types</h3>
                <ul className="admin-discovery-this-week__list">
                  {thisWeekSummary.launchActivityTypes.map((entry) => (
                    <li key={entry.type}>
                      <strong>{entry.type}</strong> · {entry.count} this week
                      <span className="admin-discovery-this-week__meta">
                        NEW filter until {entry.newUntil}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-discovery-this-week__panel">
                <h3 className="admin-discovery-this-week__label">By source</h3>
                <ul className="admin-discovery-this-week__list">
                  {thisWeekSummary.bySource.slice(0, 8).map((entry) => (
                    <li key={entry.source}>
                      {entry.source} · {entry.count}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-discovery-this-week__panel">
                <h3 className="admin-discovery-this-week__label">By city</h3>
                <ul className="admin-discovery-this-week__list">
                  {thisWeekSummary.byCity.slice(0, 8).map((entry) => (
                    <li key={entry.city}>
                      {entry.city} · {entry.count}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
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
              option.id === 'thisWeek'
                ? thisWeekSummary.total
                : option.id === 'pending'
                  ? counts.pending
                  : option.id === 'new'
                    ? counts.newPending
                    : option.id === 'already'
                      ? counts.alreadyPending
                      : option.id === 'approved'
                        ? counts.approved
                        : option.id === 'live'
                          ? counts.live
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
          bulkBusy={bulkBusy || goLiveBusy}
          onSelect={handleSelect}
          onSaveEdits={handleSaveEdits}
          onApprove={handleApprove}
          onBulkApprove={(rows) => void handleBulkApprove(rows)}
          onGoLive={(rows) => void handleGoLive(rows)}
          onDismiss={handleDismiss}
          onRestore={handleRestore}
        />
      </section>
    </>
  )
}
