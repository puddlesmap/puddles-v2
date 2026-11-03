import { useEffect, useState } from 'react'
import { AdminEventEditForm } from '../../components/admin/AdminEventEditForm'
import { BeforeYouGoTipItems } from '../../components/event-detail/BeforeYouGoIcon'
import type { AdminEventEditableFields } from '../../types/adminEventEdit'
import {
  editableFieldsFromEvent,
  prepareEventForPublish,
} from '../../utils/adminEventEdit'
import {
  loadAdminPublishQueue,
  stageAdminEvent,
  subscribeToAdminPublishQueue,
  type AdminPublishQueueItem,
} from '../../utils/adminPublishQueue'
import { formatEventDate, formatEventTimeRange } from '../../utils/dates'
import { parseEventTips } from '../../utils/eventTips'

function usePublishQueue(): AdminPublishQueueItem[] {
  const [items, setItems] = useState<AdminPublishQueueItem[]>([])

  useEffect(() => {
    const refresh = () => setItems(loadAdminPublishQueue().items)
    refresh()
    return subscribeToAdminPublishQueue(refresh)
  }, [])

  return items
}

function ApprovedCard({ item }: { item: AdminPublishQueueItem }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<AdminEventEditableFields>(() =>
    editableFieldsFromEvent(item.event),
  )
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setDraft(editableFieldsFromEvent(item.event))
  }, [item])

  const event = item.event
  const tips = parseEventTips(event.tips)
  const saveDisabled = !draft.title.trim() || !draft.date.trim() || !draft.venue.trim()

  function handleSave() {
    const next = prepareEventForPublish(event, draft)
    stageAdminEvent(next, item.source, item.sourceId)
    setMessage('Saved. It stays in the header Publish until you publish.')
    setOpen(false)
  }

  return (
    <article className="admin-approved-card">
      <header className="admin-approved-card__header">
        <div>
          <h3 className="admin-approved-card__title">{event.title}</h3>
          <p className="admin-approved-card__meta">
            {formatEventDate(event.openingDate || event.date)}
            {' · '}
            {formatEventTimeRange(event.startTime, event.endTime)}
            {' · '}
            {event.venue}
            {event.city ? ` · ${event.city}` : ''}
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? 'Close edit' : 'Edit'}
        </button>
      </header>

      <dl className="admin-seasonal-review__facts">
        <div>
          <dt>Cost</dt>
          <dd>{event.cost || '—'}</dd>
        </div>
        <div>
          <dt>Ages</dt>
          <dd>{event.ageRange || '—'}</dd>
        </div>
      </dl>
      {event.description ? <p className="admin-seasonal-review__description">{event.description}</p> : null}
      <div className="admin-seasonal-review__tips">
        <span>Before you go</span>
        {tips.length > 0 ? (
          <ul className="event-detail-tips-list">
            <BeforeYouGoTipItems items={tips} />
          </ul>
        ) : (
          <p>No verified preparation guidance yet.</p>
        )}
      </div>

      {open ? (
        <div className="admin-approved-card__edit">
          <AdminEventEditForm draft={draft} onChange={setDraft} />
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={saveDisabled}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      ) : null}
      {message ? (
        <p className="admin-action-alert admin-action-alert--success" role="status">
          {message}
        </p>
      ) : null}
    </article>
  )
}

export function AdminApprovedPage() {
  const items = usePublishQueue()

  return (
    <div className="admin-approved-page">
      <div className="admin-events-header">
        <div>
          <h2 className="font-display text-xl text-charcoal">Approved</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Last check before the header Publish. These are not Draft Events.
          </p>
        </div>
        <p className="text-sm text-muted">
          {items.length} waiting
        </p>
      </div>

      {items.length === 0 ? (
        <div className="admin-empty">
          <p className="font-medium text-charcoal">Nothing is waiting to publish.</p>
          <p className="mt-1 text-sm text-muted">
            Approve an item in Review, then it shows up here for a last edit.
          </p>
        </div>
      ) : (
        <div className="admin-approved-list">
          {items.map((item) => (
            <ApprovedCard key={`${item.source}:${item.sourceId}`} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
