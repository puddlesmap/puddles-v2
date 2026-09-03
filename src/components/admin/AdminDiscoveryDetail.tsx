import { Fragment, useEffect, useState, type ReactNode } from 'react'
import type { DiscoveryCandidate, DiscoveryEditableFields } from '../../types/discovery'
import { ACTIVITY_TYPES } from '../../types/event'
import { formatEventDate, formatEventTimeRange } from '../../utils/dates'
import { latestApprovedOnForCandidate } from '../../utils/discoveryMatchEvents'
import { editableFieldsFromCandidate } from '../../utils/discoveryReview'
import { DetailSection } from './AdminDetailGrid'

const ACTIVITY_TYPE_OPTIONS = ACTIVITY_TYPES

interface AdminDiscoveryDetailProps {
  candidate: DiscoveryCandidate
  busy: boolean
  onSaveEdits: (edits: DiscoveryEditableFields) => void
  onApprove: (edits: DiscoveryEditableFields) => void
  onGoLive: () => void
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
  onGoLive,
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
  const canGoLive = candidate.reviewStatus === 'approved'
  const approveDisabled = busy || !canApprove || !draft.title.trim() || !draft.date.trim()
  const approvedOnDisplay = latestApprovedOnForCandidate({ ...candidate, ...draft })

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
          <Field label="Good to know (tips)">
            <textarea
              className="admin-discovery-input admin-discovery-textarea"
              rows={3}
              value={draft.tips}
              onChange={(e) => update('tips', e.target.value)}
              disabled={busy}
              placeholder="Bring a blanket… registration notes…"
            />
          </Field>
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
          {candidate.reviewStatus === 'live' && approvedOnDisplay ? (
            <p className="text-sm text-muted">
              <strong>Live on the public site</strong> (Approved on {approvedOnDisplay}). Check Events
              → Live after deploy finishes.
            </p>
          ) : candidate.reviewStatus === 'approved' && approvedOnDisplay ? (
            <p className="text-sm text-muted">
              <strong>Ready — Approved on {approvedOnDisplay}</strong>. Click <strong>Go live</strong>{' '}
              to publish on the public site (~2–4 min).
            </p>
          ) : candidate.alreadyOnPuddles ? (
            <p className="text-sm text-muted">
              Already on Puddles
              {approvedOnDisplay ? ` (last verified ${approvedOnDisplay})` : ''}.{' '}
              <strong>Approve</strong> updates Last checked to <em>today</em>, then{' '}
              <strong>Go live</strong> refreshes the public catalog.
            </p>
          ) : (
            <p className="text-sm text-muted">
              <strong>Approve</strong> marks Ready. <strong>Go live</strong> publishes to the public
              site.
            </p>
          )}
        </div>
      </DetailSection>

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
        {canGoLive ? (
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={busy}
            onClick={onGoLive}
          >
            {busy ? 'Going live…' : 'Go live'}
          </button>
        ) : null}
        {!canApprove && !canGoLive ? (
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={busy}
            onClick={onRestore}
          >
            Restore to pending
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
