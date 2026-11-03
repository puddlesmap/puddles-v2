import { useMemo, useState, type ReactElement } from 'react'
import type { TipSuggestion } from '../../types/tipKnowledge'
import { BeforeYouGoIcon } from '../event-detail/BeforeYouGoIcon'
import {
  getFactDependencyIds,
  loadFactsWithOverrides,
  recordFactUsedByEvent,
  saveFactOverride,
} from '../../utils/tipKnowledgeBrowserStore'
import { getFactById } from '../../data/knowledge'

interface AdminTipKnowledgePanelProps {
  eventId: string
  suggestions: TipSuggestion[]
  needsReview: TipSuggestion[]
  venueId: string | null
  programId: string | null
  busy?: boolean
  onAccept: (suggestion: TipSuggestion) => void
  onRemoveFromTips: (suggestion: TipSuggestion) => void
}

function ScopeBadge({ scope }: { scope: TipSuggestion['scope'] }): ReactElement {
  const label = scope === 'venue' ? 'Venue' : scope === 'program' ? 'Program' : 'Event'
  return <span className={`admin-tip-knowledge__scope admin-tip-knowledge__scope--${scope}`}>{label}</span>
}

function SuggestionRow({
  suggestion,
  busy,
  eventId,
  onAccept,
  onRemoveFromTips,
}: {
  suggestion: TipSuggestion
  busy?: boolean
  eventId: string
  onAccept: (suggestion: TipSuggestion) => void
  onRemoveFromTips: (suggestion: TipSuggestion) => void
}): ReactElement {
  const [editing, setEditing] = useState(false)
  const [draftText, setDraftText] = useState(suggestion.text)
  const [saveMessage, setSaveMessage] = useState('')
  const deps = useMemo(() => getFactDependencyIds(suggestion.factId), [suggestion.factId])

  function handleAccept() {
    const next = editing ? { ...suggestion, text: draftText.trim() || suggestion.text, prefixedLine: `${suggestion.icon}|${draftText.trim() || suggestion.text}` } : suggestion
    onAccept(next)
    recordFactUsedByEvent(suggestion.factId, eventId)
    setEditing(false)
    setSaveMessage('')
  }

  function handleSaveBack() {
    const base = getFactById(suggestion.factId, loadFactsWithOverrides())
    if (!base || base.scope === 'event') {
      setSaveMessage('Event-only tips are not saved to the shared library.')
      return
    }
    const dependants = getFactDependencyIds(suggestion.factId)
    if (dependants.length > 0 && !window.confirm(
      `This fact is used by ${dependants.length} event(s): ${dependants.slice(0, 5).join(', ')}${dependants.length > 5 ? '…' : ''}. Update the shared library? Published tips on those events will not change until re-approved.`,
    )) {
      return
    }
    saveFactOverride({
      ...base,
      text: draftText.trim() || suggestion.text,
      verifiedAt: new Date().toISOString().slice(0, 10),
      status: 'verified',
    })
    setSaveMessage('Saved to this browser’s knowledge library. Commit data/knowledge to share with the team.')
  }

  return (
    <li className="admin-tip-knowledge__row">
      <div className="admin-tip-knowledge__row-main">
        <BeforeYouGoIcon kind={suggestion.icon} />
        <div className="admin-tip-knowledge__row-body">
          <div className="admin-tip-knowledge__meta">
            <ScopeBadge scope={suggestion.scope} />
            <span className="admin-tip-knowledge__category">{suggestion.category}</span>
            {suggestion.stale ? <span className="admin-tip-knowledge__flag">Re-verify</span> : null}
            {!suggestion.reuseSafe ? <span className="admin-tip-knowledge__flag">Check listing</span> : null}
          </div>
          {editing ? (
            <textarea
              className="admin-discovery-input admin-discovery-textarea"
              rows={2}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              disabled={busy}
            />
          ) : (
            <p className="admin-tip-knowledge__text">{suggestion.text}</p>
          )}
          <p className="admin-tip-knowledge__source">
            {suggestion.sourceUrl ? (
              <a href={suggestion.sourceUrl} target="_blank" rel="noreferrer">
                {suggestion.sourceType} · verified {suggestion.verifiedAt}
              </a>
            ) : (
              <span>
                {suggestion.sourceType} · verified {suggestion.verifiedAt}
              </span>
            )}
            {deps.length > 0 ? (
              <span className="admin-tip-knowledge__deps"> · Used by {deps.length} event(s)</span>
            ) : null}
          </p>
          {suggestion.reviewNote ? (
            <p className="admin-tip-knowledge__review-note">{suggestion.reviewNote}</p>
          ) : null}
          {saveMessage ? <p className="admin-tip-knowledge__save-msg">{saveMessage}</p> : null}
        </div>
      </div>
      <div className="admin-tip-knowledge__actions">
        <button type="button" className="admin-btn admin-btn-primary" disabled={busy} onClick={handleAccept}>
          Accept
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          disabled={busy}
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? 'Cancel edit' : 'Edit'}
        </button>
        {editing ? (
          <button type="button" className="admin-btn admin-btn-secondary" disabled={busy} onClick={handleSaveBack}>
            Save to library
          </button>
        ) : null}
        <button
          type="button"
          className="admin-btn admin-btn-text"
          disabled={busy}
          onClick={() => onRemoveFromTips(suggestion)}
        >
          Remove
        </button>
      </div>
    </li>
  )
}

export function AdminTipKnowledgePanel({
  eventId,
  suggestions,
  needsReview,
  venueId,
  programId,
  busy,
  onAccept,
  onRemoveFromTips,
}: AdminTipKnowledgePanelProps): ReactElement {
  return (
    <div className="admin-tip-knowledge">
      <div className="admin-tip-knowledge__header">
        <p className="admin-tip-knowledge__title">Research & reusable knowledge</p>
        <p className="admin-tip-knowledge__match">
          {venueId ? <>Venue matched · <code>{venueId}</code></> : 'No venue match'}
          {' · '}
          {programId ? <>Program matched · <code>{programId}</code></> : 'No program match'}
        </p>
      </div>

      {suggestions.length === 0 && needsReview.length === 0 ? (
        <p className="admin-tip-knowledge__empty">
          No reusable tips yet for this venue/program. Research the official listing, then Accept into Good
          to know — or Save to library after Edit.
        </p>
      ) : null}

      {suggestions.length > 0 ? (
        <section className="admin-tip-knowledge__section" aria-label="Suggested Before you go">
          <h4 className="admin-tip-knowledge__section-title">Suggested tips</h4>
          <ul className="admin-tip-knowledge__list">
            {suggestions.map((suggestion) => (
              <SuggestionRow
                key={suggestion.factId}
                suggestion={suggestion}
                busy={busy}
                eventId={eventId}
                onAccept={onAccept}
                onRemoveFromTips={onRemoveFromTips}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {needsReview.length > 0 ? (
        <section className="admin-tip-knowledge__section" aria-label="Needs review">
          <h4 className="admin-tip-knowledge__section-title">Needs review</h4>
          <ul className="admin-tip-knowledge__list">
            {needsReview.map((suggestion) => (
              <SuggestionRow
                key={`review-${suggestion.factId}`}
                suggestion={suggestion}
                busy={busy}
                eventId={eventId}
                onAccept={onAccept}
                onRemoveFromTips={onRemoveFromTips}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
