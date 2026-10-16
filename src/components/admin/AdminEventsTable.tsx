import { Fragment } from 'react'
import type { AdminEventRecord } from '../../types/admin'
import type { AdminEventEditableFields } from '../../types/adminEventEdit'
import type { EventStatus } from '../../types/event'
import { formatEventDate, formatEventTimeRange } from '../../utils/dates'
import type { DuplicateCluster } from '../../utils/eventDuplicates'
import { eventDetailScore } from '../../utils/eventDuplicates'
import type { AdminReviewFlag } from '../../utils/adminReviewFlags'
import { ADMIN_REVIEW_FLAG_LABELS } from '../../utils/adminReviewFlags'
import { seasonalListingLabels, collectionNamesForEvent } from '../../utils/adminSeasonalEvents'
import { AdminEventDetailPanel } from './AdminEventDetail'

function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`admin-badge admin-badge-status admin-badge-status-${status.toLowerCase()}`}>
      {status}
    </span>
  )
}

function LivePastBadge({ isLive, isPast }: { isLive: boolean; isPast: boolean }) {
  if (isLive) {
    return <span className="admin-badge admin-badge-yes">Live</span>
  }
  if (isPast) {
    return <span className="admin-badge admin-badge-past">Past</span>
  }
  return <span className="admin-badge admin-badge-no">Not live</span>
}

const COLUMN_COUNT = 6

interface AdminEventsTableProps {
  events: AdminEventRecord[]
  busyId: string | null
  selectedId: string | null
  bulkBusy?: boolean
  onSelect: (event: AdminEventRecord) => void
  onHide: (event: AdminEventRecord) => void
  /** Approve edits for the shared Admin Publish queue. */
  onSaveAndPublish?: (event: AdminEventRecord, edits: AdminEventEditableFields) => void
  onCancel?: (event: AdminEventRecord) => void
  /** When set, render events grouped by duplicate cluster with keep/hide actions. */
  duplicateClusters?: DuplicateCluster[]
  busyClusterId?: string | null
  onKeepWinner?: (cluster: DuplicateCluster) => void
  reviewFlagsByEventId?: Map<string, AdminReviewFlag[]>
  onDismissFlag?: (flagId: string) => void
}

export function AdminEventsTable({
  events,
  busyId,
  selectedId,
  bulkBusy = false,
  onSelect,
  onHide,
  onSaveAndPublish,
  onCancel,
  duplicateClusters,
  busyClusterId = null,
  onKeepWinner,
  reviewFlagsByEventId,
  onDismissFlag,
}: AdminEventsTableProps) {
  if (duplicateClusters) {
    if (duplicateClusters.length === 0) {
      return (
        <div className="admin-empty">
          <p className="font-medium text-charcoal">No possible duplicates found.</p>
          <p className="mt-1 text-sm text-muted">
            Refresh from Sheet after adding events, or check another view.
          </p>
        </div>
      )
    }

    return (
      <div className="admin-duplicates-list">
        {duplicateClusters.map((cluster, index) => {
          const isBusy = busyClusterId === cluster.id
          return (
            <section key={cluster.id} className="admin-duplicate-cluster">
              <div className="admin-duplicate-cluster__header">
                <div>
                  <h3 className="admin-duplicate-cluster__title">
                    Group {index + 1} · {cluster.members.length} listings ·{' '}
                    {cluster.matchReason === 'unique-url' ? 'same official URL' : 'same schedule'}
                  </h3>
                  <p className="admin-duplicate-cluster__meta">
                    Recommended keep: <strong>{cluster.winner.title}</strong> —{' '}
                    {cluster.winnerReasons.join('; ')}
                  </p>
                </div>
                {onKeepWinner ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    disabled={isBusy}
                    onClick={() => onKeepWinner(cluster)}
                  >
                    {isBusy ? 'Hiding…' : `Keep winner · hide ${cluster.losers.length}`}
                  </button>
                ) : null}
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>City</th>
                      <th>When</th>
                      <th>Status</th>
                      <th>Site</th>
                      <th>Score</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cluster.members.map((event) => {
                      const isWinner = event.id === cluster.winner.id
                      const score = eventDetailScore(event).total
                      const isExpanded = selectedId === event.id
                      return (
                        <Fragment key={event.id}>
                          <tr
                            className={`admin-table-row-clickable ${isExpanded ? 'admin-table-row-selected' : ''} ${isWinner ? 'admin-duplicate-row-winner' : ''}`}
                            onClick={() => onSelect(event)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                onSelect(event)
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-expanded={isExpanded}
                          >
                            <td>
                              <div className="admin-event-title">{event.title}</div>
                              <div className="admin-event-meta">{event.venue}</div>
                            </td>
                            <td>{event.city}</td>
                            <td>
                              <div className="whitespace-nowrap">{formatEventDate(event.date)}</div>
                              <div className="admin-event-meta whitespace-nowrap">
                                {formatEventTimeRange(event.startTime, event.endTime)}
                              </div>
                            </td>
                            <td>
                              <StatusBadge status={event.status} />
                            </td>
                            <td>
                              <LivePastBadge isLive={event.isLive} isPast={event.isPast} />
                            </td>
                            <td>{score}</td>
                            <td>
                              {isWinner ? (
                                <span className="admin-badge admin-badge-yes">Keep</span>
                              ) : (
                                <span className="admin-badge admin-badge-no">Hide</span>
                              )}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="admin-table-expand-row">
                              <td colSpan={7}>
                                <AdminEventDetailPanel
                                  event={event}
                                  busy={busyId === event.id}
                                  onSaveAndPublish={
                                    onSaveAndPublish
                                      ? (edits) => onSaveAndPublish(event, edits)
                                      : undefined
                                  }
                                  onCancel={onCancel ? () => onCancel(event) : undefined}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="admin-empty">
        <p className="font-medium text-charcoal">No events match this view.</p>
        <p className="mt-1 text-sm text-muted">Try another overview card or clear your search.</p>
      </div>
    )
  }

  return (
    <div className="admin-events-table-shell">
      <div className="admin-table-wrap">
        <table className="admin-table admin-table-events">
          <colgroup>
            <col className="admin-col-event" />
            <col className="admin-col-city" />
            <col className="admin-col-when" />
            <col className="admin-col-status" />
            <col className="admin-col-site" />
            <col className="admin-col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th className="admin-col-event">Event</th>
              <th className="admin-col-city">City</th>
              <th className="admin-col-when">When</th>
              <th className="admin-col-status">Status</th>
              <th className="admin-col-site">Site</th>
              <th className="admin-table-actions-col admin-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const isExpanded = selectedId === event.id
              const isBusy = busyId === event.id
              const canHide = event.status !== 'Hidden' && event.status !== 'Cancelled'
              const canCancel = onCancel && event.status === 'Published' && !event.isPast
              const reviewFlags = reviewFlagsByEventId?.get(event.id) ?? []
              const listingLabels = [
                ...collectionNamesForEvent(event.id),
                ...seasonalListingLabels(event),
              ]

              return (
                <Fragment key={event.id}>
                  <tr
                    className={[
                      'admin-table-row-clickable',
                      'admin-events-row',
                      isExpanded ? 'admin-table-row-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onSelect(event)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(event)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${event.title}`}
                  >
                    <td className="admin-col-event">
                      <div className="admin-event-title" title={event.title}>
                        {event.title}
                      </div>
                      <div className="admin-event-meta" title={event.venue}>
                        {event.venue}
                      </div>
                      {listingLabels.length > 0 ? (
                        <div className="admin-event-flag-tags">
                          {listingLabels.map((label) => (
                            <span
                              key={label}
                              className="admin-badge admin-badge-status admin-badge-status-draft"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {reviewFlags.length > 0 ? (
                        <div className="admin-event-flag-tags">
                          {reviewFlags.map((flag) => (
                            <span
                              key={flag.id}
                              className={`admin-badge admin-review-flag-badge admin-review-flag-badge--${flag.type}`}
                              title={flag.note}
                            >
                              {ADMIN_REVIEW_FLAG_LABELS[flag.type]}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="admin-col-city">{event.city}</td>
                    <td className="admin-col-when">
                      <div className="whitespace-nowrap">{formatEventDate(event.date)}</div>
                      <div className="admin-event-meta whitespace-nowrap">
                        {formatEventTimeRange(event.startTime, event.endTime)}
                      </div>
                    </td>
                    <td className="admin-col-status">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="admin-col-site">
                      <LivePastBadge isLive={event.isLive} isPast={event.isPast} />
                    </td>
                    <td className="admin-table-actions-cell admin-table-actions-col" onClick={(e) => e.stopPropagation()}>
                      <div className="admin-table-actions">
                        {canCancel ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            disabled={isBusy || bulkBusy}
                            onClick={() => onCancel(event)}
                          >
                            {isBusy ? 'Cancelling…' : 'Cancel'}
                          </button>
                        ) : null}
                        {canHide ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn-text"
                            disabled={isBusy || bulkBusy}
                            onClick={() => onHide(event)}
                          >
                            {isBusy ? 'Removing…' : 'Remove'}
                          </button>
                        ) : event.status === 'Cancelled' ? (
                          <span className="admin-badge admin-badge-status admin-badge-status-cancelled">
                            Cancelled
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-status admin-badge-status-hidden">
                            Hidden
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="admin-table-expand-row">
                      <td colSpan={COLUMN_COUNT}>
                        <AdminEventDetailPanel
                          event={event}
                          busy={busyId === event.id}
                          reviewFlags={reviewFlags.length > 0 ? reviewFlags : undefined}
                          onDismissFlag={onDismissFlag}
                          onSaveAndPublish={
                            onSaveAndPublish ? (edits) => onSaveAndPublish(event, edits) : undefined
                          }
                          onCancel={onCancel ? () => onCancel(event) : undefined}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
