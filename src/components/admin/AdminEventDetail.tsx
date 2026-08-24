import { useEffect, useState } from 'react'
import type { AdminEventRecord } from '../../types/admin'
import type { AdminEventEditableFields } from '../../types/adminEventEdit'
import { editableFieldsFromEvent } from '../../utils/adminEventEdit'
import { formatEventDate, formatEventTimeRange } from '../../utils/dates'
import { DetailSection } from './AdminDetailGrid'
import { AdminEventEditForm } from './AdminEventEditForm'

interface AdminEventDetailPanelProps {
  event: AdminEventRecord
  busy?: boolean
  onSaveAndPublish?: (edits: AdminEventEditableFields) => void
  onCancel?: () => void
}

export function AdminEventDetailPanel({
  event,
  busy = false,
  onSaveAndPublish,
  onCancel,
}: AdminEventDetailPanelProps) {
  const [draft, setDraft] = useState<AdminEventEditableFields>(() => editableFieldsFromEvent(event))

  useEffect(() => {
    setDraft(editableFieldsFromEvent(event))
  }, [event])

  const saveDisabled =
    busy || !onSaveAndPublish || !draft.title.trim() || !draft.date.trim() || !draft.venue.trim()

  const canCancel =
    onCancel && event.status === 'Published' && !event.isPast

  return (
    <div className="admin-table-expand-panel" aria-label="Event details">
      <div className="admin-discovery-meta">
        <span className={`admin-badge admin-badge-status admin-badge-status-${event.status.toLowerCase()}`}>
          {event.status}
        </span>
        {event.isLive ? (
          <span className="admin-badge admin-badge-yes">Live on site</span>
        ) : (
          <span className="admin-badge admin-badge-no">Not live</span>
        )}
        <span className="text-sm text-muted">ID: {event.id}</span>
      </div>

      <DetailSection title="Edit event">
        <AdminEventEditForm draft={draft} onChange={setDraft} busy={busy} />
        <p className="text-sm text-muted">
          Preview: {formatEventDate(draft.date)} · {formatEventTimeRange(draft.startTime, draft.endTime)}{' '}
          · {draft.venue || '—'}
        </p>
      </DetailSection>

      {(onSaveAndPublish || onCancel) ? (
        <div className="admin-discovery-actions">
          {onSaveAndPublish ? (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={saveDisabled}
              onClick={() => onSaveAndPublish(draft)}
            >
              {busy ? 'Publishing…' : 'Save & publish'}
            </button>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={busy}
              onClick={onCancel}
            >
              {busy ? 'Cancelling…' : 'Cancel activity'}
            </button>
          ) : null}
          {event.eventUrl && event.eventUrl !== '#' ? (
            <a
              href={event.eventUrl}
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn-text"
            >
              Official page ↗
            </a>
          ) : null}
        </div>
      ) : null}

      <p className="mt-2 text-xs text-muted">
        Saves to the public catalog via GitHub (~2–4 min). Enrichment runs automatically (types, tips,
        truncated descriptions).
      </p>
    </div>
  )
}
