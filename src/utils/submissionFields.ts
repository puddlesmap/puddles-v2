import type { SheetSubmission } from '../types/submission'

/** One-time / Recurring from column or legacy internal notes. */
export function submissionEventType(submission: SheetSubmission): string | null {
  if (submission.eventType?.trim()) return submission.eventType.trim()
  const notes = submission.internalNotes || ''
  const match = notes.match(/(One-time event|Recurring class)/)
  return match?.[1] ?? null
}

/** Display cost from Cost Type + Cost Detail (or legacy Cost column). */
export function formatSubmissionCost(submission: SheetSubmission): string | null {
  if (submission.costType) {
    if (submission.costType === 'Paid / Ticketed' && submission.costDetail) {
      return `${submission.costType} — ${submission.costDetail}`
    }
    if (submission.costDetail) {
      return `${submission.costType} (${submission.costDetail})`
    }
    return submission.costType
  }
  return submission.cost?.trim() || null
}

/** Display sign-up requirement + optional link. */
export function formatSubmissionSignup(submission: SheetSubmission): string | null {
  if (!submission.signupRequirement) return null
  if (submission.signupLinkInfo) {
    return `${submission.signupRequirement} — ${submission.signupLinkInfo}`
  }
  return submission.signupRequirement
}

/** Short preview for admin table rows. */
export function submissionSummaryMeta(submission: SheetSubmission): string | null {
  const parts = [
    submission.ageRange,
    formatSubmissionCost(submission),
    submission.signupRequirement,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

/** Primary description text for admin preview (not parent logistics). */
export function submissionPreviewText(submission: SheetSubmission): string | null {
  const text = submission.eventDescription?.trim() || submission.additionalInfo?.trim()
  return text || null
}
