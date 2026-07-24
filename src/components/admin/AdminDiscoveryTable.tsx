import { Fragment } from 'react'
import type { DiscoveryCandidate } from '../../types/discovery'
import { formatEventDate, formatEventTimeRange } from '../../utils/dates'
import { AdminDiscoveryDetailPanel } from './AdminDiscoveryDetail'
import type { DiscoveryEditableFields } from '../../types/discovery'

const COLUMN_COUNT = 7

interface AdminDiscoveryTableProps {
  candidates: DiscoveryCandidate[]
  selectedId: string | null
  busyId: string | null
  onSelect: (candidate: DiscoveryCandidate) => void
  onSaveEdits: (candidate: DiscoveryCandidate, edits: DiscoveryEditableFields) => void
  onApprove: (candidate: DiscoveryCandidate, edits: DiscoveryEditableFields) => void
  onDismiss: (candidate: DiscoveryCandidate) => void
  onRestore: (candidate: DiscoveryCandidate) => void
}

function StatusBadge({ candidate }: { candidate: DiscoveryCandidate }) {
  if (candidate.reviewStatus === 'approved') {
    return <span className="admin-badge admin-badge-yes">Approved</span>
  }
  if (candidate.reviewStatus === 'dismissed') {
    return <span className="admin-badge admin-badge-no">Dismissed</span>
  }
  if (candidate.alreadyOnPuddles) {
    return <span className="admin-badge admin-badge-status">On site</span>
  }
  return <span className="admin-badge admin-badge-yes">New</span>
}

export function AdminDiscoveryTable({
  candidates,
  selectedId,
  busyId,
  onSelect,
  onSaveEdits,
  onApprove,
  onDismiss,
  onRestore,
}: AdminDiscoveryTableProps) {
  if (candidates.length === 0) {
    return (
      <div className="admin-empty">
        <p className="font-medium text-charcoal">No discovery candidates in this view.</p>
        <p className="mt-1 text-sm text-muted">
          Run <code>npm run discover:palo-alto</code> to refresh the queue, or switch filters.
        </p>
      </div>
    )
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Title</th>
            <th>Venue</th>
            <th>Ages</th>
            <th>Tips</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => {
            const isSelected = selectedId === candidate.id
            const isBusy = busyId === candidate.id
            return (
              <Fragment key={candidate.id}>
                <tr
                  className={`admin-table-row-clickable ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => onSelect(candidate)}
                >
                  <td className="admin-table-cell-nowrap">
                    <div>{formatEventDate(candidate.date)}</div>
                    <div className="text-xs text-muted">
                      {formatEventTimeRange(candidate.startTime, candidate.endTime)}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium text-charcoal">{candidate.title}</div>
                    <div className="text-xs text-muted">
                      {(candidate.types || []).join(', ') || '—'}
                    </div>
                  </td>
                  <td>
                    <div>{candidate.venue || '—'}</div>
                    {candidate.room ? <div className="text-xs text-muted">{candidate.room}</div> : null}
                  </td>
                  <td className="admin-table-cell-nowrap">{candidate.ageRange || '—'}</td>
                  <td>
                    <div className="admin-discovery-tips-preview">
                      {candidate.tips?.trim() ? candidate.tips.split('\n')[0] : '—'}
                    </div>
                  </td>
                  <td>
                    <StatusBadge candidate={candidate} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn admin-btn-text"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(candidate)
                      }}
                    >
                      {isSelected ? 'Close' : 'Review'}
                    </button>
                  </td>
                </tr>
                {isSelected ? (
                  <tr className="admin-table-expand-row">
                    <td colSpan={COLUMN_COUNT}>
                      <AdminDiscoveryDetailPanel
                        candidate={candidate}
                        busy={isBusy}
                        onSaveEdits={(edits) => onSaveEdits(candidate, edits)}
                        onApprove={(edits) => onApprove(candidate, edits)}
                        onDismiss={() => onDismiss(candidate)}
                        onRestore={() => onRestore(candidate)}
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
