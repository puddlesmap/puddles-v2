import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DiscoveryCandidate, DiscoveryEditableFields } from '../../types/discovery'
import type { TipSuggestion } from '../../types/tipKnowledge'
import { ACTIVITY_TYPES } from '../../types/event'
import {
  discoveryImageCacheKey,
  isIrrelevantEventImageUrl,
} from '../../utils/eventImageDiscovery'
import { formatEventDate, formatEventTimeRange } from '../../utils/dates'
import { latestApprovedOnForCandidate } from '../../utils/discoveryMatchEvents'
import { editableFieldsFromCandidate } from '../../utils/discoveryReview'
import { otherCityDestinationWarning } from '../../utils/discoveryApproveLocal'
import { parentTipWarnings, stripInternalNotesForPublish } from '../../utils/discoveryInternalNotes'
import { parseEventTips } from '../../utils/eventTips'
import {
  appendTipLine,
  composeTipSuggestions,
  removeTipLineByText,
} from '../../utils/tipKnowledgeCompose'
import { loadFactsWithOverrides } from '../../utils/tipKnowledgeBrowserStore'
import { BeforeYouGoTipItems } from '../event-detail/BeforeYouGoIcon'
import { AdminTipKnowledgePanel } from './AdminTipKnowledgePanel'
import { DetailSection } from './AdminDetailGrid'

const ACTIVITY_TYPE_OPTIONS = ACTIVITY_TYPES

type ImagePick = {
  url: string
  label: string
}

const imageDiscoveryCache = new Map<string, ImagePick[]>()

function photoKey(url: string): string {
  return url.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp))/i, '').split('?')[0]
}

interface AdminDiscoveryDetailProps {
  candidate: DiscoveryCandidate
  busy: boolean
  onSaveEdits: (edits: DiscoveryEditableFields) => void
  onApprove: (edits: DiscoveryEditableFields) => void
  onDismiss: () => void
  onRestore: () => void
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="admin-discovery-field">
      <span className="admin-discovery-field__label">{label}</span>
      {children}
    </label>
  )
}

export function AdminDiscoveryDetailPanel({
  candidate,
  busy,
  onSaveEdits,
  onApprove,
  onDismiss,
  onRestore,
}: AdminDiscoveryDetailProps) {
  const [draft, setDraft] = useState<DiscoveryEditableFields>(() =>
    editableFieldsFromCandidate(candidate),
  )

  useEffect(() => {
    setDraft(editableFieldsFromCandidate(candidate))
  }, [candidate])

  function update<K extends keyof DiscoveryEditableFields>(key: K, value: DiscoveryEditableFields[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function toggleType(type: string) {
    setDraft((current) => {
      const has = current.types.includes(type)
      return {
        ...current,
        types: has ? current.types.filter((t) => t !== type) : [...current.types, type],
      }
    })
  }

  const canApprove = candidate.reviewStatus === 'pending'
  const approveDisabled = busy || !canApprove || !draft.title.trim() || !draft.date.trim()
  const approvedOnDisplay = latestApprovedOnForCandidate({ ...candidate, ...draft })
  const tipWarnings = useMemo(() => parentTipWarnings(draft.tips), [draft.tips])
  const cityWarning = useMemo(
    () => otherCityDestinationWarning(candidate, draft),
    [candidate, draft],
  )
  const tipLines = useMemo(
    () => parseEventTips(stripInternalNotesForPublish(draft.tips)),
    [draft.tips],
  )
  const knowledge = useMemo(
    () =>
      composeTipSuggestions(
        {
          title: draft.title,
          venue: draft.venue,
          city: draft.city,
          description: draft.description,
          tips: draft.tips,
          eventUrl: draft.eventUrl,
          eventId: candidate.id,
        },
        { facts: loadFactsWithOverrides() },
      ),
    [
      draft.title,
      draft.venue,
      draft.city,
      draft.description,
      draft.tips,
      draft.eventUrl,
      candidate.id,
    ],
  )
  const imageUrl = (draft.imageUrl ?? '').trim()
  const [officialPicks, setOfficialPicks] = useState<ImagePick[]>([])
  const [lookingForImage, setLookingForImage] = useState(false)

  function acceptKnowledgeTip(suggestion: TipSuggestion) {
    setDraft((current) => ({
      ...current,
      tips: appendTipLine(current.tips, suggestion.prefixedLine),
    }))
  }

  function removeKnowledgeTip(suggestion: TipSuggestion) {
    setDraft((current) => ({
      ...current,
      tips: removeTipLineByText(current.tips, suggestion.text),
    }))
  }

  function acceptAllSafeTips() {
    setDraft((current) => {
      let tips = current.tips
      for (const suggestion of knowledge.suggestions) {
        if (!suggestion.reuseSafe || suggestion.stale) continue
        tips = appendTipLine(tips, suggestion.prefixedLine)
      }
      return { ...current, tips }
    })
  }

  useEffect(() => {
    const sourceUrl = candidate.eventUrl.trim()
    // Preserve any manually chosen / already-saved image — do not rediscover over it.
    if (imageUrl || !/^https?:\/\//i.test(sourceUrl)) {
      setOfficialPicks([])
      setLookingForImage(false)
      return
    }

    const cacheKey = discoveryImageCacheKey(sourceUrl, {
      title: draft.title,
      venue: draft.venue,
      types: draft.types,
    })
    const cached = imageDiscoveryCache.get(cacheKey)
    if (cached) {
      setOfficialPicks(cached)
      setLookingForImage(false)
      return
    }

    let cancelled = false
    setLookingForImage(true)
    setOfficialPicks([])

    void fetch('/api/admin/event-images', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrls: [sourceUrl],
        title: draft.title,
        description: draft.description,
        venue: draft.venue,
        types: draft.types,
      }),
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          ok?: boolean
          candidates?: Array<{ imageUrl?: string; reason?: string; sourceLabel?: string }>
          error?: string
        }
        if (!response.ok || data.ok === false) {
          throw new Error(data.error || 'Could not look on the official page.')
        }
        return (data.candidates ?? [])
          .map((item) => ({
            url: String(item.imageUrl ?? '').trim(),
            label: [item.reason?.trim(), item.sourceLabel?.trim()].filter(Boolean).join(' · ') || 'Official page',
          }))
          .filter((item) => item.url.length > 0 && !isIrrelevantEventImageUrl(item.url))
          .filter((item, index, all) => all.findIndex((other) => photoKey(other.url) === photoKey(item.url)) === index)
          .slice(0, 3)
      })
      .then((picks) => {
        if (cancelled) return
        imageDiscoveryCache.set(cacheKey, picks)
        setOfficialPicks(picks)
      })
      .catch(() => {
        if (cancelled) return
        imageDiscoveryCache.set(cacheKey, [])
        setOfficialPicks([])
      })
      .finally(() => {
        if (!cancelled) setLookingForImage(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    candidate.id,
    candidate.eventUrl,
    draft.title,
    draft.description,
    draft.venue,
    draft.types,
    imageUrl,
  ])

  // Recommendations only — never pad with host/stock. Empty → clay fallback on public site.
  const imageChoices = imageUrl ? [] : officialPicks
  const showImagePicker = !lookingForImage && imageChoices.length > 1

  return (
    <div className="admin-table-expand-panel" aria-label="Discovery candidate details">
      <div className="admin-discovery-meta">
        <span className="admin-badge admin-badge-status">{candidate.reviewStatus}</span>
        {candidate.alreadyOnPuddles ? (
          <span className="admin-badge admin-badge-no">Already on Puddles</span>
        ) : (
          <span className="admin-badge admin-badge-yes">New</span>
        )}
        {candidate.source ? <span className="text-sm text-muted">{candidate.source}</span> : null}
        {candidate.convertedEventId ? (
          <span className="text-sm text-muted">Draft ID: {candidate.convertedEventId}</span>
        ) : null}
        {approvedOnDisplay ? (
          <span className="text-sm text-muted">Approved on {approvedOnDisplay}</span>
        ) : null}
      </div>
      {cityWarning ? (
        <div className="admin-discovery-tip-warnings" role="status">
          <p>{cityWarning}</p>
        </div>
      ) : null}

      <div className="admin-discovery-detail-layout">
      <DetailSection title="Edit before approve">
        <div className="admin-discovery-form">
          <Field label="Title">
            <input
              className="admin-discovery-input"
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              disabled={busy}
            />
          </Field>
          <div className="admin-discovery-form__row">
            <Field label="Date">
              <input
                type="date"
                className="admin-discovery-input"
                value={draft.date}
                onChange={(e) => update('date', e.target.value)}
                disabled={busy}
              />
            </Field>
            <Field label="Start">
              <input
                type="time"
                className="admin-discovery-input"
                value={draft.startTime}
                onChange={(e) => update('startTime', e.target.value)}
                disabled={busy}
              />
            </Field>
            <Field label="End">
              <input
                type="time"
                className="admin-discovery-input"
                value={draft.endTime}
                onChange={(e) => update('endTime', e.target.value)}
                disabled={busy}
              />
            </Field>
          </div>
          <div className="admin-discovery-form__row">
            <Field label="Venue">
              <input
                className="admin-discovery-input"
                value={draft.venue}
                onChange={(e) => update('venue', e.target.value)}
                disabled={busy}
              />
            </Field>
            <Field label="Room">
              <input
                className="admin-discovery-input"
                value={draft.room}
                onChange={(e) => update('room', e.target.value)}
                disabled={busy}
              />
            </Field>
          </div>
          <Field label="Address">
            <input
              className="admin-discovery-input"
              value={draft.address}
              onChange={(e) => update('address', e.target.value)}
              disabled={busy}
            />
          </Field>
          <div className="admin-discovery-form__row">
            <Field label="City">
              <input
                className="admin-discovery-input"
                value={draft.city}
                onChange={(e) => update('city', e.target.value)}
                disabled={busy}
              />
            </Field>
            <Field label="Ages">
              <input
                className="admin-discovery-input"
                value={draft.ageRange}
                onChange={(e) => update('ageRange', e.target.value)}
                disabled={busy}
                placeholder="0–2, 2–5"
              />
            </Field>
            <Field label="Cost">
              <select
                className="admin-discovery-input"
                value={draft.cost}
                onChange={(e) => update('cost', e.target.value)}
                disabled={busy}
              >
                <option value="Free">Free</option>
                <option value="Low-cost">Low-cost</option>
                <option value="Paid">Paid</option>
              </select>
            </Field>
          </div>
          <Field label="Types">
            <div className="admin-discovery-types">
              {ACTIVITY_TYPE_OPTIONS.map((type) => (
                <label key={type} className="admin-discovery-type">
                  <input
                    type="checkbox"
                    checked={draft.types.includes(type)}
                    onChange={() => toggleType(type)}
                    disabled={busy}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Description">
            <textarea
              className="admin-discovery-input admin-discovery-textarea"
              rows={4}
              value={draft.description}
              onChange={(e) => update('description', e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field label="Internal review notes (Admin only — not published)">
            <textarea
              className="admin-discovery-input admin-discovery-textarea admin-discovery-input--internal"
              rows={3}
              value={draft.internalReviewNotes ?? ''}
              onChange={(e) => update('internalReviewNotes', e.target.value)}
              disabled={busy}
              placeholder="Verify pricing on official page · one row per series · editorial reminders…"
            />
          </Field>
          <Field label="Good to know (parents see this on Puddles)">
            <textarea
              className="admin-discovery-input admin-discovery-textarea"
              rows={3}
              value={draft.tips}
              onChange={(e) => update('tips', e.target.value)}
              disabled={busy}
              placeholder="Advance registration required · strollers welcome · what to bring…"
            />
          </Field>
          {knowledge.suggestions.some((s) => s.reuseSafe && !s.stale) ? (
            <div className="admin-tip-knowledge__accept-all">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={busy}
                onClick={acceptAllSafeTips}
              >
                Accept all safe library tips
              </button>
            </div>
          ) : null}
          {tipWarnings.length > 0 ? (
            <div className="admin-discovery-tip-warnings" role="status">
              {tipWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
          <AdminTipKnowledgePanel
            eventId={candidate.id}
            suggestions={knowledge.suggestions}
            needsReview={knowledge.needsReview}
            venueId={knowledge.venueId}
            programId={knowledge.programId}
            busy={busy}
            onAccept={acceptKnowledgeTip}
            onRemoveFromTips={removeKnowledgeTip}
          />
          <Field label="Official URL">
            <input
              className="admin-discovery-input"
              value={draft.eventUrl}
              onChange={(e) => update('eventUrl', e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field label="Image URL">
            <input
              className="admin-discovery-input"
              value={draft.imageUrl}
              onChange={(e) => update('imageUrl', e.target.value)}
              disabled={busy}
            />
          </Field>
          {!imageUrl && lookingForImage ? (
            <p className="admin-discovery-parent-preview__empty">Looking on the official page for photos…</p>
          ) : null}
          {showImagePicker ? (
            <div className="admin-discovery-image-picks">
              <p className="admin-discovery-image-picks__note">
                {imageChoices.length} relevant photos from the official page. Pick one, then save edits.
              </p>
              <ul className="admin-discovery-image-picks__list">
                {imageChoices.map((pick) => (
                  <li key={pick.url} className="admin-discovery-image-picks__item">
                    <img src={pick.url} alt="" />
                    <span>{pick.label}</span>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      disabled={busy}
                      onClick={() => update('imageUrl', pick.url)}
                    >
                      Use this
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {!imageUrl && !lookingForImage && imageChoices.length === 1 ? (
            <div className="admin-discovery-image-picks">
              <p className="admin-discovery-image-picks__note">{imageChoices[0].label}</p>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={busy}
                onClick={() => update('imageUrl', imageChoices[0].url)}
              >
                Use suggested photo
              </button>
            </div>
          ) : null}
          {candidate.reviewStatus === 'live' && approvedOnDisplay ? (
            <p className="text-sm text-muted">
              <strong>Live on the public site</strong> (Approved on {approvedOnDisplay}). Check Events
              → Live after deploy finishes.
            </p>
          ) : candidate.reviewStatus === 'approved' && approvedOnDisplay ? (
            <p className="text-sm text-muted">
              <strong>Approved on {approvedOnDisplay}</strong> — in header <strong>Publish</strong>.
              Edit on <strong>Approved</strong> nav before you publish (~2–4 min).
            </p>
          ) : candidate.alreadyOnPuddles ? (
            <p className="text-sm text-muted">
              Already on Puddles
              {approvedOnDisplay ? ` (last verified ${approvedOnDisplay})` : ''}.{' '}
              <strong>Approve</strong> updates Last checked to <em>today</em> and adds the row to
              header <strong>Publish</strong>.
            </p>
          ) : (
            <p className="text-sm text-muted">
              <strong>Approve</strong> adds this row to header <strong>Publish</strong> for the public
              site.
            </p>
          )}
        </div>
      </DetailSection>

      <aside className="admin-discovery-parent-preview" aria-label="Parent view">
        <p className="admin-discovery-parent-preview__kicker">Parent preview</p>
        {imageUrl ? (
          <img className="admin-discovery-parent-preview__image" src={imageUrl} alt="" />
        ) : lookingForImage ? (
          <p className="admin-discovery-parent-preview__empty">Looking on the official page…</p>
        ) : imageChoices.length === 1 ? (
          <img
            className="admin-discovery-parent-preview__image"
            src={imageChoices[0].url}
            alt=""
          />
        ) : (
          <p className="admin-discovery-parent-preview__empty">
            No event photo yet — Puddles default image will be used.
          </p>
        )}
        {tipLines.length > 0 ? (
          <section
            className="event-detail-tips"
            aria-labelledby={`discovery-tips-${candidate.id}`}
          >
            <h2 id={`discovery-tips-${candidate.id}`} className="event-detail-tips-label">
              Before you go
            </h2>
            <ul className="event-detail-tips-list">
              <BeforeYouGoTipItems items={tipLines} />
            </ul>
          </section>
        ) : (
          <p className="admin-discovery-parent-preview__empty">No Before you go yet.</p>
        )}
      </aside>
      </div>

      <div className="admin-discovery-actions">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          disabled={busy}
          onClick={() => onSaveEdits(draft)}
        >
          Save edits
        </button>
        {canApprove ? (
          <Fragment>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={approveDisabled}
              onClick={() => onApprove(draft)}
            >
              {busy
                ? candidate.alreadyOnPuddles
                  ? 'Updating…'
                  : 'Approving…'
                : candidate.alreadyOnPuddles
                  ? 'Update verified date'
                  : 'Approve'}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={busy}
              onClick={onDismiss}
            >
              Dismiss
            </button>
          </Fragment>
        ) : null}
        {candidate.reviewStatus === 'dismissed' || candidate.reviewStatus === 'approved' ? (
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={busy}
            onClick={onRestore}
          >
            {candidate.reviewStatus === 'approved' ? 'Back to pending' : 'Restore to pending'}
          </button>
        ) : null}
        {candidate.eventUrl ? (
          <a
            href={candidate.eventUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-btn admin-btn-text"
          >
            Official page ↗
          </a>
        ) : null}
      </div>

      {candidate.alreadyOnPuddles && canApprove ? (
        <p className="mt-3 text-sm text-muted">
          Already on site: Approve only refreshes the verified date (no second listing).
        </p>
      ) : null}

      <p className="mt-2 text-xs text-muted">
        Preview: {formatEventDate(draft.date)} ·{' '}
        {formatEventTimeRange(draft.startTime, draft.endTime)} · {draft.venue || '—'}
      </p>
    </div>
  )
}
