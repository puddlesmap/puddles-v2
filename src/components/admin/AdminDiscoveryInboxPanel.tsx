import { memo, useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { DiscoveryCandidate } from '../../types/discovery'
import {
  approveBlocked,
  candidateReviewTiming,
  emptyInbox,
  labelCandidate,
  needsDecision,
} from '../../utils/discoveryInboxCore.mjs'
import type { DiscoveryInboxFile, InboxCandidate, InboxLabel } from '../../utils/discoveryInboxCore.mjs'
import { ALL_EVENTS } from '../../data/events'
import { ACTIVITY_TYPES } from '../../types/event'
import {
  applyInboxChoice,
  approveDiscoveryLocally,
  getAdminEventForPublish,
  type InboxChoiceInput,
} from '../../utils/discoveryApproveLocal'
import { removeStagedAdminEvent, stageAdminEvent } from '../../utils/adminPublishQueue'
import {
  addToSeasonalSection,
  getActiveThemeSlugForAdmin,
} from '../../utils/seasonalCurationStaging'
import { editableFieldsFromCandidate, pacificTodayYmd, saveDiscoveryReviewRecord } from '../../utils/discoveryReview'
import { parseEventTips } from '../../utils/eventTips'
import { extractSpecificAgeRecommendationFromText } from '../../utils/eventAgeRecommendation'
import { BeforeYouGoTipItems } from '../event-detail/BeforeYouGoIcon'
import { AdminEventImageReview } from './AdminEventImageReview'

type Row = {
  origin: 'inbox' | 'library'
  candidate: InboxCandidate
  label: InboxLabel
  library?: DiscoveryCandidate
}

function formatRun(run: DiscoveryInboxFile['latestRun']): string {
  if (!run?.completedAt) return 'No discovery run yet'
  const when = new Date(run.completedAt)
  const stamp = Number.isNaN(when.getTime())
    ? run.completedAt
    : when.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
  return `Last discovery: ${stamp} · ${run.sourcesChecked} checked · ${run.sourcesSucceeded} succeeded · ${run.sourcesUnreadable} unreadable · ${run.sourcesFailed} failed`
}

function inboxChoice(row: InboxCandidate): InboxChoiceInput['choice'] {
  if (row.occurrenceChoice === 'replace') return 'replace'
  if (row.occurrenceChoice === 'new') return 'new'
  return 'create'
}

function toChoiceInput(row: InboxCandidate, label: InboxLabel): InboxChoiceInput {
  return {
    choice: inboxChoice(row),
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    venue: row.venue,
    city: row.city,
    ageRange: row.ageRange,
    bestFor: row.bestFor || '',
    cost: row.cost,
    description: row.description,
    tips: row.tips,
    types: row.types,
    imageUrl: row.imageUrl,
    eventUrl: row.eventUrl || row.sourceUrl,
    matchedEventId: label.matchedEventId,
  }
}

function sourceFacts(candidate: InboxCandidate) {
  const snapshot = candidate.sourceSnapshot
  const time = [candidate.startTime, candidate.endTime].filter(Boolean).join('–')
  return [
    { label: 'Title', value: snapshot.titleText || candidate.title },
    { label: 'Date', value: snapshot.dateText || candidate.date },
    { label: 'Time', value: snapshot.timeText || time || 'Not stated' },
    { label: 'Description', value: candidate.sourceExcerpt || candidate.description || 'Not stated' },
    { label: 'Age', value: snapshot.ageText || candidate.ageRange || 'Not stated' },
    {
      label: 'Location',
      value: snapshot.locationText || [candidate.venue, candidate.city].filter(Boolean).join(', ') || 'Not stated',
    },
    { label: 'Cost', value: snapshot.costText || candidate.cost || 'Not stated' },
  ]
}

function placementLabel(candidate: InboxCandidate): string {
  if (candidate.placement === 'seasonal') return 'Seasonal · close to home'
  if (candidate.placement === 'drive') return 'Seasonal · worth a little drive'
  const coreCities = new Set(['Palo Alto', 'Mountain View', 'Los Altos', 'Sunnyvale'])
  return coreCities.has(candidate.city) ? 'Browse · core city' : 'Placement review needed'
}

function eventIdentity(candidate: { id?: string; title?: string; date?: string; venue?: string; city?: string }) {
  const norm = (value?: string) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return `${norm(candidate.title)}|${candidate.date || ''}|${norm(candidate.venue || candidate.city)}`
}

function placementValue(candidate: InboxCandidate): 'browse' | 'seasonal' | 'drive' {
  if (candidate.placement) return candidate.placement
  return new Set(['Palo Alto', 'Mountain View', 'Los Altos', 'Sunnyvale']).has(candidate.city)
    ? 'browse'
    : 'drive'
}

function stageCandidateEvent(candidate: InboxCandidate, event: ReturnType<typeof getAdminEventForPublish>) {
  if (!event) return
  const placement = placementValue(candidate)
  const prepared = {
    ...event,
    isSeasonal: placement !== 'browse',
    isRegional: placement === 'drive',
  }
  stageAdminEvent(prepared, 'discovery', candidate.id)
  if (placement !== 'browse') {
    addToSeasonalSection(
      event.id,
      placement === 'drive' ? 'worthADrive' : 'closeToHome',
      getActiveThemeSlugForAdmin(),
    )
  }
}

async function postInbox(body: Record<string, unknown>) {
  const response = await fetch('/api/discovery-inbox', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await response.json()) as { ok?: boolean; error?: string; inbox?: DiscoveryInboxFile }
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || 'Could not update the inbox.')
  }
  return data
}

type ReviewCardProps = {
  row: Row
  draft: InboxCandidate
  expanded: boolean
  busy: boolean
  onToggle: (id: string) => void
  onApprove: (row: Row) => void
  onIgnore: (row: Row) => void
  onChoice: (row: Row, choice: 'replace' | 'new') => void
  onDraft: (id: string, base: InboxCandidate, patch: Partial<InboxCandidate>) => void
  flagLine: (label: InboxLabel) => string
}

const DiscoveryReviewCard = memo(function DiscoveryReviewCard({
  row,
  draft,
  expanded,
  busy,
  onToggle,
  onApprove,
  onIgnore,
  onChoice,
  onDraft,
  flagLine,
}: ReviewCardProps) {
  const candidate = expanded ? draft : row.candidate
  const label = expanded ? labelCandidate(candidate, ALL_EVENTS) : row.label
  const blocked = approveBlocked(candidate, label)
  const tipItems = parseEventTips(candidate.tips)
  const sourceAgeSuggestion = extractSpecificAgeRecommendationFromText(
    candidate.sourceSnapshot.ageText || candidate.sourceExcerpt,
  )
  const bestForSuggestion = sourceAgeSuggestion?.startsWith('Best for') ? sourceAgeSuggestion : null
  const updateCandidate = (patch: Partial<InboxCandidate>) => {
    onDraft(row.candidate.id, candidate, patch)
  }
  return (
            <article
              key={`${row.origin}-${row.candidate.id}`}
              className={`admin-review-card${label.flags.length > 0 ? ' admin-review-card--attention' : ''}`}
            >
              <header className="admin-review-card__head">
                <button
                  type="button"
                  className="admin-review-card__toggle"
                  aria-expanded={expanded}
                  onClick={() => onToggle(row.candidate.id)}
                >
                  <span>
                    <strong>{candidate.title || 'Untitled event'}</strong>
                    <small>
                      {candidate.date || 'Date missing'}
                      {candidate.startTime ? ` · ${candidate.startTime}` : ''}
                      {candidate.venue ? ` · ${candidate.venue}` : ''}
                    </small>
                  </span>
                  <span aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
                <span className="admin-review-card__status">{flagLine(label)}</span>
              </header>

              {expanded ? (
                <>
                  <div className="admin-review-card__split">
                    <section className="admin-review-card__block">
                      <div className="admin-review-card__section-head">
                        <h3>Source facts</h3>
                        <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">
                          {candidate.sourceName} ↗
                        </a>
                      </div>
                      <dl className="admin-review-card__facts">
                        {sourceFacts(candidate).map((fact) => (
                          <div key={fact.label}>
                            <dt>{fact.label}</dt>
                            <dd>{fact.value}</dd>
                          </div>
                        ))}
                        <div>
                          <dt>Link</dt>
                          <dd>
                            <a href={candidate.eventUrl || candidate.sourceUrl} target="_blank" rel="noreferrer">
                              Open official event page ↗
                            </a>
                          </dd>
                        </div>
                      </dl>
                      {candidate.discoveredAt ? (
                        <p className="admin-review-card__source-note">Discovered {candidate.discoveredAt}</p>
                      ) : null}
                    </section>

                    <section className="admin-review-card__block admin-review-card__draft">
                      <div className="admin-review-card__section-head">
                        <h3>Puddles draft</h3>
                        <span>{placementLabel(candidate)}</span>
                      </div>

                      {label.needsChoice ? (
                        <div className="admin-review-card__decision">
                          <strong>Is this a separate occurrence or a rescheduled event?</strong>
                          <p>Choose one before approving so Puddles does not create a duplicate.</p>
                          <div>
                            <button
                              type="button"
                              className="admin-btn admin-btn-secondary"
                              onClick={() => void onChoice(row, 'new')}
                            >
                              New occurrence
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-secondary"
                              onClick={() => void onChoice(row, 'replace')}
                            >
                              Replace existing date
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {label.detectedChanges.length > 0 ? (
                        <p className="admin-review-card__changes">
                          <strong>Detected changes:</strong> {label.detectedChanges.join(' · ')}
                        </p>
                      ) : null}

                      <label className="admin-discovery-field">
                        <span className="admin-discovery-field__label">Event title</span>
                        <input
                          className="admin-discovery-input"
                          value={candidate.title}
                          onChange={(event) => updateCandidate({ title: event.target.value })}
                        />
                      </label>

                      <div className="admin-review-card__field-row">
                        <label className="admin-discovery-field">
                          <span className="admin-discovery-field__label">Date</span>
                          <input
                            type="date"
                            className="admin-discovery-input"
                            value={candidate.date}
                            onChange={(event) => updateCandidate({ date: event.target.value })}
                          />
                        </label>
                        <label className="admin-discovery-field">
                          <span className="admin-discovery-field__label">Start</span>
                          <input
                            type="time"
                            className="admin-discovery-input"
                            value={candidate.startTime}
                            onChange={(event) => updateCandidate({ startTime: event.target.value })}
                          />
                        </label>
                        <label className="admin-discovery-field">
                          <span className="admin-discovery-field__label">End</span>
                          <input
                            type="time"
                            className="admin-discovery-input"
                            value={candidate.endTime}
                            onChange={(event) => updateCandidate({ endTime: event.target.value })}
                          />
                        </label>
                      </div>

                      <label className="admin-discovery-field">
                        <span className="admin-discovery-field__label">Event description</span>
                        <textarea
                          className="admin-discovery-input admin-discovery-textarea"
                          rows={3}
                          value={candidate.description}
                          onChange={(event) => updateCandidate({ description: event.target.value })}
                        />
                      </label>

                      <div className="admin-review-card__field-row admin-review-card__field-row--two">
                        <label className="admin-discovery-field">
                          <span className="admin-discovery-field__label">Age group</span>
                          <input
                            className="admin-discovery-input"
                            value={candidate.ageRange}
                            onChange={(event) => updateCandidate({ ageRange: event.target.value })}
                          />
                        </label>
                        <label className="admin-discovery-field">
                          <span className="admin-discovery-field__label">Best for</span>
                          <input
                            className="admin-discovery-input"
                            value={candidate.bestFor || ''}
                            placeholder="Only when the official source names an age"
                            onChange={(event) => updateCandidate({ bestFor: event.target.value })}
                          />
                          {bestForSuggestion && !candidate.bestFor ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn-text"
                              onClick={() => updateCandidate({ bestFor: bestForSuggestion })}
                            >
                              Use verified suggestion: {bestForSuggestion}
                            </button>
                          ) : (
                            <small>Leave blank when the official source does not name a specific age or audience.</small>
                          )}
                        </label>
                        <label className="admin-discovery-field">
                          <span className="admin-discovery-field__label">Cost</span>
                          <input
                            className="admin-discovery-input"
                            value={candidate.cost}
                            onChange={(event) => updateCandidate({ cost: event.target.value })}
                          />
                        </label>
                      </div>

                      <div className="admin-review-card__field-row admin-review-card__field-row--two">
                        <label className="admin-discovery-field">
                          <span className="admin-discovery-field__label">Venue</span>
                          <input
                            className="admin-discovery-input"
                            value={candidate.venue}
                            onChange={(event) => updateCandidate({ venue: event.target.value })}
                          />
                        </label>
                        <label className="admin-discovery-field">
                          <span className="admin-discovery-field__label">City</span>
                          <input
                            className="admin-discovery-input"
                            value={candidate.city}
                            onChange={(event) => updateCandidate({ city: event.target.value })}
                          />
                        </label>
                      </div>

                      <label className="admin-discovery-field">
                        <span className="admin-discovery-field__label">Official event link</span>
                        <input
                          className="admin-discovery-input"
                          value={candidate.eventUrl}
                          onChange={(event) => updateCandidate({ eventUrl: event.target.value })}
                        />
                      </label>

                      <div className="admin-review-card__field-row admin-review-card__field-row--two">
                        <label className="admin-discovery-field">
                          <span className="admin-discovery-field__label">Category</span>
                          <select
                            className="admin-discovery-input"
                            value={candidate.types?.[0] || 'Other'}
                            onChange={(event) => updateCandidate({ types: [event.target.value] })}
                          >
                            {ACTIVITY_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </label>
                        <label className="admin-discovery-field">
                          <span className="admin-discovery-field__label">Placement</span>
                          <select
                            className="admin-discovery-input"
                            value={placementValue(candidate)}
                            onChange={(event) =>
                              updateCandidate({
                                placement: event.target.value as 'browse' | 'seasonal' | 'drive',
                              })
                            }
                          >
                            <option value="browse">Browse · core city</option>
                            <option value="seasonal">Seasonal · close to home</option>
                            <option value="drive">Seasonal · worth a little drive</option>
                          </select>
                        </label>
                      </div>

                      <div className="admin-review-card__tips-preview">
                        <span>Before you go · as parents would see it</span>
                        {tipItems.length > 0 ? (
                          <ul className="event-detail-tips-list">
                            <BeforeYouGoTipItems items={tipItems} />
                          </ul>
                        ) : (
                          <p>No verified preparation guidance yet.</p>
                        )}
                      </div>
                      <label className="admin-discovery-field">
                        <span className="admin-discovery-field__label">Before you go · stored</span>
                        <textarea
                          className="admin-discovery-input admin-discovery-textarea"
                          rows={3}
                          value={candidate.tips}
                          onChange={(event) => updateCandidate({ tips: event.target.value })}
                        />
                      </label>

                      <AdminEventImageReview
                        key={row.candidate.id}
                        title={candidate.title}
                        venue={candidate.venue}
                        eventUrl={candidate.eventUrl || candidate.sourceUrl}
                        types={candidate.types || []}
                        imageUrl={candidate.imageUrl}
                        busy={busy}
                        onChange={(imageUrl) => updateCandidate({ imageUrl })}
                      />
                    </section>
                  </div>

                  <footer className="admin-review-card__actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      disabled={blocked || busy}
                      onClick={() => void onApprove(row)}
                    >
                      {busy ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      disabled={busy}
                      onClick={() => void onIgnore(row)}
                    >
                      Remove
                    </button>
                    {blocked ? <span>Resolve the highlighted decision or missing source fact first.</span> : null}
                  </footer>
                </>
              ) : null}
            </article>
  )
}, (previous, next) => {
  if (previous.row !== next.row || previous.expanded !== next.expanded || previous.busy !== next.busy) return false
  if (next.expanded && previous.draft !== next.draft) return false
  return true
})

export function AdminDiscoveryInboxPanel({
  libraryCandidates,
  onLibraryChange,
}: {
  libraryCandidates: DiscoveryCandidate[]
  onLibraryChange?: () => void
}) {
  const [inbox, setInbox] = useState<DiscoveryInboxFile>(emptyInbox())
  const [link, setLink] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(30)
  const [drafts, setDrafts] = useState<Record<string, Partial<InboxCandidate>>>({})

  async function refresh() {
    const response = await fetch('/api/discovery-inbox', { credentials: 'include' })
    const data = (await response.json()) as { ok?: boolean; inbox?: DiscoveryInboxFile; error?: string }
    if (!response.ok || !data.inbox) {
      setError(data.error || 'Could not load the discovery inbox.')
      return
    }
    setInbox({ ...emptyInbox(), ...data.inbox })
  }

  useEffect(() => {
    void refresh()
  }, [])

  const rows = useMemo(() => {
    const catalog = ALL_EVENTS
    const inboxRows: Row[] = (inbox.candidates || [])
      .filter((candidate) => candidate.decision !== 'ignored' && candidate.decision !== 'live')
      .map((candidate) => {
        const shaped = {
          ...candidate,
          types: Array.isArray(candidate.types) ? candidate.types : [],
        }
        return {
          origin: 'inbox' as const,
          candidate: shaped,
          label: labelCandidate(shaped, catalog),
        }
      })
    const inboxKeys = new Set(inboxRows.flatMap((row) => [row.candidate.id, eventIdentity(row.candidate)]))
    const libraryRows: Row[] = libraryCandidates
      .filter((candidate) => candidate.reviewStatus === 'pending')
      .filter((candidate) => !inboxKeys.has(candidate.id) && !inboxKeys.has(eventIdentity(candidate)))
      .map((candidate) => {
        const shaped: InboxCandidate = {
          id: candidate.id,
          identityKey: candidate.id,
          title: candidate.title,
          date: candidate.date,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          city: candidate.city,
          venue: candidate.venue,
          cost: candidate.cost,
          ageRange: candidate.ageRange,
          bestFor: candidate.bestFor || '',
          description: candidate.description,
          tips: candidate.tips,
          types: candidate.types || [],
          imageUrl: candidate.imageUrl,
          eventUrl: candidate.eventUrl,
          sourceUrl: candidate.eventUrl,
          sourceName: candidate.source || 'Library',
          sourceExcerpt: candidate.description || candidate.tips || candidate.title,
          sourceSnapshot: {
            titleText: '',
            dateText: '',
            timeText: '',
            locationText: '',
            costText: '',
            ageText: '',
          },
          providerEventId: '',
          isCancelled: candidate.isCancelled,
          needsReview: false,
          reviewReasons: [],
          discoveredAt: candidate.lastChecked || '',
          decision: 'pending',
          occurrenceChoice: '',
        }
        return {
          origin: 'library' as const,
          candidate: shaped,
          label: labelCandidate(shaped, catalog),
          library: candidate,
        }
      })
    return [...inboxRows, ...libraryRows]
  }, [inbox.candidates, libraryCandidates])

  const pendingRows = rows.filter((row) => row.candidate.decision !== 'ready')
  const later = pendingRows.filter(
    (row) => candidateReviewTiming(row.candidate) === 'later' && row.label.status !== 'Updated',
  )
  const decisions = pendingRows.filter(
    (row) =>
      needsDecision(row.label) &&
      (candidateReviewTiming(row.candidate) === 'review' || row.label.status === 'Updated'),
  )
  const sortedDecisions = [...decisions].sort((a, b) =>
    `${a.candidate.date || '9999'}${a.candidate.startTime || ''}`.localeCompare(
      `${b.candidate.date || '9999'}${b.candidate.startTime || ''}`,
    ),
  )
  const visibleDecisions = sortedDecisions.slice(0, visibleCount)
  const skipped = rows.filter((row) => row.label.status === 'Existing' && row.label.flags.length === 0).length
  const counts = {
    new: decisions.filter((row) => row.label.status === 'New').length,
    updated: decisions.filter((row) => row.label.status === 'Updated').length,
    review: decisions.filter((row) => row.label.flags.includes('needsReview') || row.label.flags.includes('possibleDuplicate')).length,
  }

  function draftFor(row: Row): InboxCandidate {
    return { ...row.candidate, ...drafts[row.candidate.id] }
  }

  const toggleCard = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id))
  }, [])

  const patchDraft = useCallback((id: string, base: InboxCandidate, patch: Partial<InboxCandidate>) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...base, ...current[id], ...patch },
    }))
  }, [])

  function flagLine(label: InboxLabel): string {
    if (label.needsChoice) return 'Needs a choice · new date or replace'
    if (label.detectedChanges.includes('cancelled or postponed')) return 'Updated · cancelled'
    if (label.detectedChanges.some((line) => line.startsWith('date:'))) return 'Updated · date changed'
    if (label.reviewReasons.includes('missing_age')) return 'Needs review · missing age'
    if (label.flags.includes('possibleDuplicate')) return 'Possible duplicate'
    if (label.flags.includes('needsReview')) return 'Needs review'
    if (label.status === 'Updated') return `Updated · ${label.detectedChanges[0] || 'changed'}`
    return label.status
  }

  async function saveChoice(row: Row, occurrenceChoice: 'replace' | 'new') {
    const next = { ...draftFor(row), occurrenceChoice }
    setDrafts((current) => ({ ...current, [row.candidate.id]: next }))
    if (row.origin === 'inbox') {
      await postInbox({ action: 'decide', id: row.candidate.id, occurrenceChoice })
      await refresh()
    }
  }

  async function approve(row: Row) {
    const candidate = draftFor(row)
    const label = labelCandidate(candidate, ALL_EVENTS)
    if (approveBlocked(candidate, label)) {
      setError('Fill the missing fields, or choose 新的一場 / 取代現有日期, before Approve.')
      return
    }
    setBusyId(row.candidate.id)
    setError('')
    try {
      if (row.origin === 'library' && row.library) {
        const verifiedDate = pacificTodayYmd()
        const edits = editableFieldsFromCandidate({ ...row.library, ...candidate })
        let eventId = ''
        if (candidate.occurrenceChoice === 'replace' || (label.status === 'Updated' && label.matchedEventId)) {
          eventId = applyInboxChoice(
            { ...toChoiceInput(candidate, label), choice: 'replace' },
            verifiedDate,
          ).eventId
        } else if (candidate.occurrenceChoice === 'new') {
          eventId = applyInboxChoice({ ...toChoiceInput(candidate, label), choice: 'new' }, verifiedDate).eventId
        } else {
          eventId = approveDiscoveryLocally(row.library, edits, verifiedDate).eventId
        }
        stageCandidateEvent(candidate, getAdminEventForPublish(eventId))
        saveDiscoveryReviewRecord(row.library.id, {
          reviewStatus: 'approved',
          edits,
          approvedOn: verifiedDate,
          updatedAt: new Date().toISOString(),
        })
        setMessage(`Approved: ${candidate.title}. It is included in the Admin Publish summary.`)
        onLibraryChange?.()
      } else {
        const choice =
          candidate.occurrenceChoice === 'new'
            ? 'new'
            : candidate.occurrenceChoice === 'replace' || (label.status === 'Updated' && label.matchedEventId)
              ? 'replace'
              : 'create'
        const applied = applyInboxChoice({ ...toChoiceInput(candidate, label), choice }, pacificTodayYmd())
        stageCandidateEvent(candidate, getAdminEventForPublish(applied.eventId))
        await postInbox({
          action: 'decide',
          ...candidate,
          id: row.candidate.id,
          decision: 'ready',
          occurrenceChoice: choice === 'create' ? candidate.occurrenceChoice : choice,
        })
        setMessage(`Approved: ${candidate.title}. It is not public until you use Publish.`)
        await refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve.')
    } finally {
      setBusyId(null)
    }
  }

  async function ignore(row: Row) {
    setBusyId(row.candidate.id)
    setError('')
    try {
      if (row.origin === 'library' && row.library) {
        removeStagedAdminEvent('discovery', row.candidate.id)
        saveDiscoveryReviewRecord(row.library.id, {
          reviewStatus: 'dismissed',
          updatedAt: new Date().toISOString(),
        })
        setMessage(`Ignored ${row.library.title} on this browser.`)
        onLibraryChange?.()
      } else {
        removeStagedAdminEvent('discovery', row.candidate.id)
        await postInbox({ action: 'decide', id: row.candidate.id, decision: 'ignored' })
        setMessage(`Ignored ${row.candidate.title}.`)
        await refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not ignore.')
    } finally {
      setBusyId(null)
    }
  }

  async function addLink(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await postInbox({ action: 'enqueue-url', sourceUrl: link.trim() })
      setLink('')
      setMessage('Queued. The browser agent reads this public page, then files a candidate here.')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not queue that link.')
    }
  }

  return (
    <section className="admin-sync-bar" aria-label="Discovery inbox">
      <p className="admin-submissions-intro">
        Review each event, then <strong>Approve</strong> or <strong>Remove</strong>. Publish all approved
        Admin changes once from the header.
      </p>
      <div className="admin-discovery-status">
        <p className="text-sm text-muted">
          {counts.new} New · {counts.updated} Updated · {counts.review} Need review
          <br />
          {skipped} unchanged skipped · {later.length} upcoming stored for later
        </p>
        <p className="text-sm text-muted">{formatRun(inbox.latestRun)}</p>
      </div>
      {(inbox.pendingUrls || []).length > 0 ? (
        <div className="text-sm text-muted">
          <p>
            {(inbox.pendingUrls || []).length} official source {(inbox.pendingUrls || []).length === 1 ? 'is' : 'are'} queued
            for discovery:
          </p>
          <ul>
            {(inbox.pendingUrls || []).map((item) => (
              <li key={`${item.url}-${item.requestedAt}`}>
                <a href={item.url} target="_blank" rel="noreferrer">
                  Open source ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <form className="admin-discovery-inbox-link" onSubmit={(event) => void addLink(event)}>
        <label className="text-sm" htmlFor="discovery-inbox-link">
          Scrape an official event page
        </label>
        <p className="text-sm text-muted">
          Queue an official event or organizer URL for discovery. This does not publish anything.
        </p>
        <input
          id="discovery-inbox-link"
          className="admin-search-input"
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="https://"
          inputMode="url"
        />
        <button type="submit" className="admin-btn admin-btn-secondary">
          Queue for discovery
        </button>
      </form>
      {message ? <p className="text-sm">{message}</p> : null}
      {error ? <p className="text-sm">{error}</p> : null}
      <div className="admin-review-card-list">
        {visibleDecisions.map((row) => (
          <DiscoveryReviewCard
            key={`${row.origin}-${row.candidate.id}`}
            row={row}
            expanded={openId === row.candidate.id}
            busy={busyId === row.candidate.id}
            draft={openId === row.candidate.id ? draftFor(row) : row.candidate}
            onToggle={toggleCard}
            onApprove={approve}
            onIgnore={ignore}
            onChoice={saveChoice}
            onDraft={patchDraft}
            flagLine={flagLine}
          />
        ))}
        {visibleCount < sortedDecisions.length ? (
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setVisibleCount((count) => count + 30)}
          >
            Show more
          </button>
        ) : null}
      </div>
    </section>
  )
}
