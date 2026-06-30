import type { SheetSubmission } from '../../types/submission'
import { formatSubmissionWhen } from '../../utils/dates'
import {
  formatSubmissionCost,
  formatSubmissionSignup,
  submissionEventType,
} from '../../utils/submissionFields'
import { isExpansionWatchSubmission } from '../../utils/expansionWatchAdmin'
import { AdminExpansionWatchDetailPanel } from './AdminExpansionWatchDetail'
import { DetailDescription, DetailRow, DetailSection } from './AdminDetailGrid'

export function AdminSubmissionDetailPanel({ submission }: { submission: SheetSubmission }) {
  if (isExpansionWatchSubmission(submission)) {
    return <AdminExpansionWatchDetailPanel submission={submission} />
  }

  const parentTips = submission.parentTips?.trim() || submission.additionalInfo?.trim()

  return (
    <div className="admin-table-expand-panel" aria-label="Submission details">
      <DetailSection title="Where & when">
        <DetailRow label="Activity type" value={submissionEventType(submission)} />
        <DetailRow label="City" value={submission.city} />
        <DetailRow label="Place or address" value={submission.locationName} />
        <DetailRow
          label="When"
          value={formatSubmissionWhen(submission.date, submission.startTime, submission.endTime)}
        />
        <DetailRow label="Link" value={submission.link} />
      </DetailSection>

      <DetailSection title="Practical details">
        <DetailRow label="Best for ages" value={submission.ageRange} />
        <DetailRow label="Cost" value={formatSubmissionCost(submission)} />
        <DetailRow label="Sign-up" value={formatSubmissionSignup(submission)} />
      </DetailSection>

      <DetailSection title="What parents shared">
        <DetailDescription label="What happens" value={submission.eventDescription} />
        <DetailDescription label="Parent tips" value={parentTips} />
        <DetailRow label="Submitted by" value={submission.submittedByEmail} />
      </DetailSection>

      {(submission.internalNotes || submission.convertedEventId) && (
        <DetailSection title="Admin">
          <DetailRow label="Form notes" value={submission.internalNotes} />
          <DetailRow label="Events tab ID" value={submission.convertedEventId} />
        </DetailSection>
      )}
    </div>
  )
}
