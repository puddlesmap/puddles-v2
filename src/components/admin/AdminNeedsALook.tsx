import { useEffect, useMemo, useState } from 'react'
import type { AdminEventEditableFields } from '../../types/adminEventEdit'
import type { Event } from '../../types/event'
import { prepareEventForPublish } from '../../utils/adminEventEdit'
import { stageAdminEvent } from '../../utils/adminPublishQueue'
import {
  ADMIN_REVIEW_FLAG_LABELS,
  collectAdminReviewFlags,
  type AdminReviewFlag,
} from '../../utils/adminReviewFlags'
import { syncReadyDiscoveryIntoAdminCache } from '../../utils/discoveryApproveLocal'
import { formatEventDate, formatEventTimeRange } from '../../utils/dates'
import { enrichPublishingFields } from '../../utils/publishing'
import { saveCachedAdminRefresh } from '../../utils/sheetSync'
import { AdminEventDetailPanel } from './AdminEventDetail'

type LookKind = 'draft' | 'attention'

interface LookRow {
  event: Event
  kind: LookKind
  flags: AdminReviewFlag[]
}

const KIND_LABEL: Record<LookKind, string> = {
  draft: 'Drafts',
  attention: 'Needs attention',
}

const KIND_HINT: Record<LookKind, string> = {
  draft: 'Saved in the catalog and not on the public site.',
  attention: 'Already live, and a field looks wrong.',
}

function classify(events: Event[]): LookRow[] {
  const flags = collectAdminReviewFlags(events)
  const flagsByEvent = new Map<string, AdminReviewFlag[]>()
  for (const flag of flags) {
    for (const eventId of flag.eventIds) {
      const existing = flagsByEvent.get(eventId) ?? []
      existing.push(flag)
      flagsByEvent.set(eventId, existing)
    }
  }

  const rows: LookRow[] = []
  for (const event of events) {
    if (event.isPast) continue
    if (event.status === 'Draft') {
      rows.push({ event, kind: 'draft', flags: [] })
      continue
    }
    if (!event.isLive) continue
    const eventFlags = flagsByEvent.get(event.id) ?? []
    if (eventFlags.length > 0) {
      rows.push({ event, kind: 'attention', flags: eventFlags })
    }
  }
  return rows.sort((a, b) => a.event.date.localeCompare(b.event.date) || a.event.title.localeCompare(b.event.title))
}

export function AdminNeedsALook() {
  const [events, setEvents] = useState<Event[]>([])
  const [ready, setReady] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const synced = syncReadyDiscoveryIntoAdminCache()
    setEvents(synced.events.map((event) => enrichPublishingFields(event)))
    setReady(true)
  }, [])

  const rows = useMemo(() => classify(events), [events])

  function remember(nextEvent: Event, note: string) {
    setEvents((current) => {
      const exists = current.some((row) => row.id === nextEvent.id)
      const next = exists
        ? current.map((row) => (row.id === nextEvent.id ? nextEvent : row))
        : [...current, nextEvent]
      saveCachedAdminRefresh({ events: next, refreshedAt: new Date().toISOString() })
      return next
    })
    setMessage(note)
  }

  async function saveEdits(event: Event, edits: AdminEventEditableFields) {
    setBusyId(event.id)
    setMessage(null)
    try {
      const published = prepareEventForPublish(event, edits)
      stageAdminEvent(published, 'events', event.id)
      remember(
        published,
        `Saved “${published.title}”. Use Publish in the Admin header to update the site.`,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save this event.')
    } finally {
      setBusyId(null)
    }
  }

  if (!ready) return null

  return (
    <section className="admin-needs-look" aria-label="Needs a look">
      <h2 className="font-display text-lg text-charcoal">Needs a look</h2>
      <p className="mt-1 text-sm text-muted">
        Drafts, and live listings with a field that looks wrong. Saving stages the same event for
        the header Publish.
      </p>
      {message ? (
        <p className="admin-action-alert admin-action-alert--success" role="status">
          {message}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="admin-needs-look__empty">Nothing needs a look.</p>
      ) : (
        (['draft', 'attention'] as const).map((kind) => {
          const group = rows.filter((row) => row.kind === kind)
          if (group.length === 0) return null
          return (
            <div key={kind} className="admin-needs-look__group">
              <h3 className="admin-needs-look__heading">
                {KIND_LABEL[kind]} <span>({group.length})</span>
              </h3>
              <p className="admin-needs-look__hint">{KIND_HINT[kind]}</p>
              <ul className="admin-needs-look__list">
                {group.map(({ event, flags }) => {
                  const open = openId === event.id
                  const reason = flags.map((flag) => ADMIN_REVIEW_FLAG_LABELS[flag.type]).join(' · ')
                  return (
                    <li key={event.id} className="admin-needs-look__row">
                      <div className="admin-needs-look__summary">
                        <div>
                          <div className="admin-event-title">{event.title}</div>
                          <div className="admin-event-meta">
                            {formatEventDate(event.date)} · {formatEventTimeRange(event.startTime, event.endTime)} ·{' '}
                            {event.city}
                            {reason ? ` · ${reason}` : ''}
                          </div>
                        </div>
                        <div className="admin-needs-look__actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => setOpenId(open ? null : event.id)}
                          >
                            {open ? 'Close' : 'Edit'}
                          </button>
                        </div>
                      </div>
                      {open ? (
                        <AdminEventDetailPanel
                          event={event}
                          busy={busyId === event.id}
                          reviewFlags={flags.length > 0 ? flags : undefined}
                          onSaveAndPublish={(edits) => void saveEdits(event, edits)}
                        />
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })
      )}
    </section>
  )
}
