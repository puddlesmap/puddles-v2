import { Fragment, useMemo } from 'react'
import type { AdminEventRecord } from '../../types/admin'
import type { AdminEventEditableFields } from '../../types/adminEventEdit'
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

const COLUMN_COUNT = 9

interface AdminEventsTableProps {
  events: AdminEventRecord[]
  busyId: string | null
  selectedId: string | null
  /** Checkbox multi-select ids (bulk actions). */
  checkedIds: string[]
  bulkBusy?: boolean
  onSelect: (event: AdminEventRecord) => void
  onToggleChecked: (eventId: string) => void
  onToggleCheckAll: (checked: boolean) => void
  onClearChecked: () => void
  onBulkApproveVerified?: (events: AdminEventRecord[]) => void
  onHide: (event: AdminEventRecord) => void
  /** Save edits and publish to the public catalog (~2–4 min). */
  onSaveAndPublish?: (event: AdminEventRecord, edits: AdminEventEditableFields) => void
  /** Stamp Last Checked / Approved on = today (Sheet + local Admin). */
  onApproveVerified?: (event: AdminEventRecord) => void
  /** When set, render events grouped by duplicate cluster with keep/hide actions. */
  duplicateClusters?: DuplicateCluster[]
  busyClusterId?: string | null
  onKeepWinner?: (cluster: DuplicateCluster) => void
}

export function AdminEventsTable({
  events,
  busyId,
  selectedId,
  checkedIds,
  bulkBusy = false,
  onSelect,
  onToggleChecked,
  onToggleCheckAll,
  onClearChecked,
  onBulkApproveVerified,
  onHide,
  onSaveAndPublish,
  onApproveVerified,
  duplicateClusters,
  busyClusterId = null,
  onKeepWinner,
}: AdminEventsTableProps) {
  const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds])
  const allVisibleChecked = events.length > 0 && events.every((event) => checkedSet.has(event.id))
  const someVisibleChecked = events.some((event) => checkedSet.has(event.id))
  const checkedEvents = useMemo(
    () => events.filter((event) => checkedSet.has(event.id)),
    [events, checkedSet],
  )

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
                      <th>Approved on</th>
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
                            <td className="whitespace-nowrap">
                              {event.verifiedDate?.trim()
                                ? `Approved on ${formatVerifiedDate(event.verifiedDate)}`
                                : '—'}
                            </td>
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
                              <td colSpan={8}>
                                <AdminEventDetailPanel
                                  event={event}
                                  busy={busyId === event.id}
                                  onSaveAndPublish={
                                    onSaveAndPublish
                                      ? (edits) => onSaveAndPublish(event, edits)
                                      : undefined
                                  }
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
      {checkedIds.length > 0 ? (
        <div className="admin-discovery-bulk-bar" role="status">
          <span className="admin-discovery-bulk-count">
            {checkedIds.length} selected
            <span className="admin-discovery-bulk-hint"> — check more rows for bulk actions</span>
          </span>
          <div className="admin-discovery-bulk-actions">
            {onBulkApproveVerified ? (
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={bulkBusy || checkedEvents.length === 0}
                onClick={() => onBulkApproveVerified(checkedEvents)}
              >
                {bulkBusy ? 'Approving…' : `Approve selected (${checkedEvents.length})`}
              </button>
            ) : null}
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={bulkBusy}
              onClick={onClearChecked}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <p className="admin-events-select-hint">
          Tip: use the checkboxes to select several events, then Approve selected.
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <colgroup>
            <col className="admin-col-check-col" />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th className="admin-col-check" scope="col">
                <label className="admin-check">
                  <span className="sr-only">Select all visible events</span>
                  <input
                    type="checkbox"
                    checked={allVisibleChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleChecked && !allVisibleChecked
                    }}
                    onChange={(e) => onToggleCheckAll(e.target.checked)}
                    disabled={bulkBusy}
                  />
                </label>
              </th>
              <th>Event</th>
              <th>City</th>
              <th>When</th>
              <th>Status</th>
              <th>Live</th>
              <th>Past</th>
              <th title="Same as Sheet Last Checked Date / Verified on Puddles">Approved on</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const stale = isVerificationStale(event)
              const isExpanded = selectedId === event.id
              const isBusy = busyId === event.id
              const isChecked = checkedSet.has(event.id)
              const canHide = event.status !== 'Hidden'
              const approvedLabel = formatVerifiedDate(event.verifiedDate)

              return (
                <Fragment key={event.id}>
                  <tr
                    className={[
                      'admin-table-row-clickable',
                      'admin-events-row',
                      isExpanded ? 'admin-table-row-selected' : '',
                      isChecked ? 'is-multi-selected' : '',
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
                    <td
                      className="admin-col-check"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <label className="admin-check">
                        <span className="sr-only">Select {event.title}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={bulkBusy}
                          onChange={() => onToggleChecked(event.id)}
                        />
                      </label>
                    </td>
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
                          {approvedLabel === '—' ? '—' : `Approved on ${approvedLabel}`}
                        </span>
                        {stale ? <span className="admin-stale-tag">Needs check</span> : null}
                      </div>
                    </td>
                    <td className="admin-table-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="admin-table-actions">
                        {onApproveVerified ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn-primary"
                            disabled={isBusy || bulkBusy}
                            onClick={() => onApproveVerified(event)}
                          >
                            {isBusy ? '…' : 'Approve'}
                          </button>
                        ) : null}
                        {canHide ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn-text"
                            disabled={isBusy || bulkBusy}
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
                        <AdminEventDetailPanel
                          event={event}
                          busy={busyId === event.id}
                          onSaveAndPublish={
                            onSaveAndPublish ? (edits) => onSaveAndPublish(event, edits) : undefined
                          }
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
