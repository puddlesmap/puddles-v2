import { Fragment } from 'react'
import type { SheetSubmission } from '../../types/submission'
import {
  SUBMISSION_STATUSES,
  isArchivedSubmission,
  submissionStatusLabel,
} from '../../types/submission'
import { formatSubmissionWhen } from '../../utils/dates'
import { formatSubmissionCost, submissionPreviewText } from '../../utils/submissionFields'
import { AdminSubmissionDetailPanel } from './AdminSubmissionDetail'

function formatSubmittedDate(value: string): string {
  if (!value?.trim()) return '—'
  const parsed = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFee(submission: SheetSubmission): string {
  return formatSubmissionCost(submission) || '—'
}

function canPromote(submission: SheetSubmission): boolean {
  return (
    submission.submissionType === 'Event' &&
    submission.status === 'Approved' &&
    !submission.convertedEventId
  )
}

function canQueueActions(submission: SheetSubmission): boolean {
  return !isArchivedSubmission(submission.status)
}

const COLUMN_COUNT = 9

interface AdminSubmissionsTableProps {
  submissions: SheetSubmission[]
  busyId: string | null
  selectedId: string | null
  showHiddenActions?: boolean
  onSelect: (submission: SheetSubmission) => void
  onStatusChange: (submission: SheetSubmission, status: string) => void
  onPromote: (submission: SheetSubmission) => void
  onSolved: (submission: SheetSubmission) => void
  onDelete: (submission: SheetSubmission) => void
  onRestore: (submission: SheetSubmission) => void
}

export function AdminSubmissionsTable({
  submissions,
  busyId,
  selectedId,
  showHiddenActions = false,
  onSelect,
  onStatusChange,
  onPromote,
  onSolved,
  onDelete,
  onRestore,
}: AdminSubmissionsTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="admin-empty">
        <p className="font-medium text-charcoal">No submissions match this view.</p>
        <p className="mt-1 text-sm text-muted">
          Refresh from the sheet after a parent submits on the Share form, or run{' '}
          <code>npm run sync-submissions</code> for deploy builds.
        </p>
      </div>
    )
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table admin-table-submissions">
        <thead>
          <tr>
            <th>Status</th>
            <th>Type</th>
            <th>Submitted Date</th>
            <th>Name / Summary</th>
            <th>When</th>
            <th>City</th>
            <th>Age</th>
            <th>Fee</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => {
            const isExpanded = selectedId === submission.id
            const isBusy = busyId === submission.id
            const preview = submissionPreviewText(submission)

            return (
              <Fragment key={submission.id}>
                <tr
                  className={`admin-table-row-clickable ${isExpanded ? 'admin-table-row-selected' : ''}`}
                  onClick={() => onSelect(submission)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(submission)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${submission.eventName || 'submission'}`}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      value={submission.status || 'New'}
                      disabled={isBusy}
                      onChange={(e) => onStatusChange(submission, e.target.value)}
                      className="input-field input-field-select admin-table-select"
                      aria-label={`Status for ${submission.eventName || submission.id}`}
                    >
                      {SUBMISSION_STATUSES.map((option) => (
                        <option key={option} value={option}>
                          {submissionStatusLabel(option)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{submission.submissionType || '—'}</td>
                  <td>{formatSubmittedDate(submission.submittedAt)}</td>
                  <td>
                    <div className="admin-event-title">{submission.eventName || '—'}</div>
                    {preview && <div className="admin-event-meta">{preview}</div>}
                  </td>
                  <td>
                    {formatSubmissionWhen(submission.date, submission.startTime, submission.endTime)}
                  </td>
                  <td>{submission.city || '—'}</td>
                  <td>{submission.ageRange || '—'}</td>
                  <td>{formatFee(submission)}</td>
                  <td className="admin-table-actions-cell" onClick={(e) => e.stopPropagation()}>
                    <div className="admin-table-actions">
                      {showHiddenActions ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-text"
                          disabled={isBusy}
                          onClick={() => onRestore(submission)}
                        >
                          Restore
                        </button>
                      ) : canQueueActions(submission) ? (
                        <div className="admin-table-action-stack">
                          <button
                            type="button"
                            className="admin-btn admin-btn-primary"
                            disabled={isBusy}
                            onClick={() => onSolved(submission)}
                          >
                            Solved
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-text"
                            disabled={isBusy}
                            onClick={() => onDelete(submission)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted">Archived</span>
                      )}
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="admin-table-expand-row">
                    <td colSpan={COLUMN_COUNT}>
                      <div className="admin-table-expand-actions" onClick={(e) => e.stopPropagation()}>
                        {canPromote(submission) && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            disabled={isBusy}
                            onClick={() => onPromote(submission)}
                          >
                            {isBusy ? 'Sending…' : 'Send to Events'}
                          </button>
                        )}
                        {submission.convertedEventId && (
                          <span className="admin-badge admin-badge-status admin-badge-status-added-to-sheet">
                            On Events tab · {submission.convertedEventId}
                          </span>
                        )}
                      </div>
                      <AdminSubmissionDetailPanel submission={submission} />
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
