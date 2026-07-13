import { Fragment } from 'react'
import type { AdminEventRecord } from '../../types/admin'
import type { EventStatus } from '../../types/event'
import { formatEventDate, formatEventTimeRange } from '../../utils/dates'
import { isVerificationStale } from '../../utils/adminEvents'
import type { DuplicateCluster } from '../../utils/eventDuplicates'
import { eventDetailScore } from '../../utils/eventDuplicates'
import { AdminEventDetailPanel } from './AdminEventDetail'

function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`admin-badge admin-badge-status admin-badge-status-${status.toLowerCase()}`}>
      {status}
    </span>
  )
}

function BoolBadge({ value, trueLabel, falseLabel }: { value: boolean; trueLabel: string; falseLabel: string }) {
  return (
    <span className={`admin-badge ${value ? 'admin-badge-yes' : 'admin-badge-no'}`}>
      {value ? trueLabel : falseLabel}
    </span>
  )
}

function formatVerifiedDate(dateStr: string): string {
  if (!dateStr?.trim()) return '—'
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const COLUMN_COUNT = 8

interface AdminEventsTableProps {
  events: AdminEventRecord[]
  busyId: string | null
  selectedId: string | null
  onSelect: (event: AdminEventRecord) => void
  onHide: (event: AdminEventRecord) => void
  /** When set, render events grouped by duplicate cluster with keep/hide actions. */
  duplicateClusters?: DuplicateCluster[]
  busyClusterId?: string | null
  onKeepWinner?: (cluster: DuplicateCluster) => void
}

export function AdminEventsTable({
  events,
  busyId,
  selectedId,
  onSelect,
  onHide,
  duplicateClusters,
  busyClusterId = null,
  onKeepWinner,
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
                      <th>Live</th>
                      <th>Score</th>
                      <th>Last checked</th>
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
                              <BoolBadge value={event.isLive} trueLabel="Live" falseLabel="Not live" />
                            </td>
                            <td>{score}</td>
                            <td className="whitespace-nowrap">{formatVerifiedDate(event.verifiedDate)}</td>
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
                              <td colSpan={COLUMN_COUNT}>
                                <AdminEventDetailPanel event={event} />
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
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>City</th>
            <th>When</th>
            <th>Status</th>
            <th>Live</th>
            <th>Past</th>
            <th>Last checked</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const stale = isVerificationStale(event)
            const isExpanded = selectedId === event.id
            const isBusy = busyId === event.id
            const canHide = event.status !== 'Hidden'

            return (
              <Fragment key={event.id}>
                <tr
                  className={`admin-table-row-clickable ${isExpanded ? 'admin-table-row-selected' : ''}`}
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
                    <BoolBadge value={event.isLive} trueLabel="Live" falseLabel="Not live" />
                  </td>
                  <td>
                    <BoolBadge value={event.isPast} trueLabel="Past" falseLabel="Upcoming" />
                  </td>
                  <td className="admin-table-last-checked">
                    <div className="admin-last-checked">
                      <span className={stale ? 'admin-verified-stale' : ''}>
                        {formatVerifiedDate(event.verifiedDate)}
                      </span>
                      {stale ? <span className="admin-stale-tag">Needs check</span> : null}
                    </div>
                  </td>
                  <td className="admin-table-actions-cell" onClick={(e) => e.stopPropagation()}>
                    <div className="admin-table-actions">
                      {canHide ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-text"
                          disabled={isBusy}
                          onClick={() => onHide(event)}
                        >
                          {isBusy ? 'Hiding…' : 'Hide'}
                        </button>
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
                      <AdminEventDetailPanel event={event} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
