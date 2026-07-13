import type { AdminReviewFlag, AdminReviewFlagType } from '../../utils/adminReviewFlags'
import {
  ADMIN_REVIEW_FLAG_LABELS,
} from '../../utils/adminReviewFlags'
import type { DuplicateCluster } from '../../utils/eventDuplicates'
import type { Event } from '../../types/event'

const TYPE_FILTERS: Array<{ key: 'all' | AdminReviewFlagType; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'duplicate', label: 'Duplicates' },
  { key: 'out_of_age', label: 'Age' },
  { key: 'out_of_area', label: 'Area' },
  { key: 'field_mismatch', label: 'Mismatch' },
]

interface AdminNeedsAttentionInboxProps {
  flags: AdminReviewFlag[]
  eventsById: Map<string, Event>
  typeFilter: 'all' | AdminReviewFlagType
  onTypeFilterChange: (filter: 'all' | AdminReviewFlagType) => void
  busyFlagId: string | null
  onHideEvent: (event: Event, flagId: string) => void
  onKeepWinner: (cluster: DuplicateCluster) => void
  onDismiss: (flagId: string) => void
  resolveCluster: (flag: AdminReviewFlag) => DuplicateCluster | undefined
}

export function AdminNeedsAttentionInbox({
  flags,
  eventsById,
  typeFilter,
  onTypeFilterChange,
  busyFlagId,
  onHideEvent,
  onKeepWinner,
  onDismiss,
  resolveCluster,
}: AdminNeedsAttentionInboxProps) {
  const visible = typeFilter === 'all' ? flags : flags.filter((flag) => flag.type === typeFilter)

  return (
    <div className="admin-needs-attention">
      <div className="admin-needs-attention__filters" role="tablist" aria-label="Flag types">
        {TYPE_FILTERS.map((filter) => {
          const count =
            filter.key === 'all'
              ? flags.length
              : flags.filter((flag) => flag.type === filter.key).length
          return (
            <button
              key={filter.key}
              type="button"
              role="tab"
              aria-selected={typeFilter === filter.key}
              className={`admin-btn ${typeFilter === filter.key ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => onTypeFilterChange(filter.key)}
            >
              {filter.label}
              {count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="admin-empty">
          <p className="font-medium text-charcoal">Nothing needs attention in this filter.</p>
          <p className="mt-1 text-sm text-muted">
            Refresh from Sheet after edits, or check another flag type.
          </p>
        </div>
      ) : (
        <ul className="admin-needs-attention__list">
          {visible.map((flag) => {
            const isBusy = busyFlagId === flag.id
            const cluster = flag.type === 'duplicate' ? resolveCluster(flag) : undefined
            const primaryEvent = eventsById.get(flag.eventIds[0] ?? '')

            return (
              <li key={flag.id} className="admin-review-flag">
                <div className="admin-review-flag__header">
                  <span className={`admin-badge admin-review-flag-badge admin-review-flag-badge--${flag.type}`}>
                    {ADMIN_REVIEW_FLAG_LABELS[flag.type]}
                  </span>
                  <span className={`admin-badge ${flag.severity === 'high' ? 'admin-badge-no' : 'admin-badge-status-draft'}`}>
                    {flag.severity}
                  </span>
                </div>

                <h3 className="admin-review-flag__title">{flag.title}</h3>
                <p className="admin-review-flag__note">{flag.note}</p>
                <p className="admin-review-flag__evidence">{flag.evidence}</p>

                {primaryEvent ? (
                  <p className="admin-review-flag__meta">
                    {primaryEvent.city} · {primaryEvent.date} · {primaryEvent.venue} · {primaryEvent.status}
                  </p>
                ) : null}

                <div className="admin-review-flag__actions">
                  {flag.type === 'duplicate' && cluster ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      disabled={isBusy}
                      onClick={() => onKeepWinner(cluster)}
                    >
                      {isBusy ? 'Hiding…' : `Keep winner · hide ${cluster.losers.length}`}
                    </button>
                  ) : null}

                  {flag.type !== 'duplicate' && primaryEvent && primaryEvent.status !== 'Hidden' ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      disabled={isBusy}
                      onClick={() => onHideEvent(primaryEvent, flag.id)}
                    >
                      {isBusy ? 'Hiding…' : 'Hide from site'}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    disabled={isBusy}
                    onClick={() => onDismiss(flag.id)}
                  >
                    Dismiss for now
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
