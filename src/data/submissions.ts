import type { SheetSubmission, SubmissionStatusFilter } from '../types/submission'
import {
  isArchivedSubmission,
  isLocallyHiddenSubmission,
  submissionIdsMatch,
} from '../types/submission'
import sheetSubmissions from './sheet-submissions.json'

export const ALL_SUBMISSIONS: SheetSubmission[] = sheetSubmissions as SheetSubmission[]

export interface SubmissionFilters {
  status?: SubmissionStatusFilter
  submissionType?: string | 'all'
  search?: string
  hiddenSubmissionIds?: string[]
}

function matchesSearch(submission: SheetSubmission, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return [
    submission.eventType,
    submission.eventName,
    submission.locationName,
    submission.city,
    submission.ageRange,
    submission.costType,
    submission.costDetail,
    submission.signupRequirement,
    submission.eventDescription,
    submission.parentTips,
    submission.additionalInfo,
    submission.submittedByEmail,
    submission.internalNotes,
  ]
    .join(' ')
    .toLowerCase()
    .includes(q)
}

function normalizeStatusFilter(status: string): string {
  const lower = status.toLowerCase()
  if (lower === 'reviewing') return 'needs review'
  if (lower === 'converted') return 'added to sheet'
  return lower
}

export function filterSubmissions(
  submissions: SheetSubmission[],
  filters: SubmissionFilters,
): SheetSubmission[] {
  const hiddenSubmissionIds = filters.hiddenSubmissionIds ?? []

  return submissions.filter((submission) => {
    const isHidden = isLocallyHiddenSubmission(submission.id, hiddenSubmissionIds)

    if (filters.status === 'hidden') {
      if (!isHidden) return false
    } else {
      if (isHidden) return false

      if (!filters.status || filters.status === 'all') {
        if (isArchivedSubmission(submission.status)) return false
      } else if (
        normalizeStatusFilter(submission.status) !== normalizeStatusFilter(filters.status)
      ) {
        return false
      }
    }

    if (
      filters.submissionType &&
      filters.submissionType !== 'all' &&
      submission.submissionType !== filters.submissionType
    ) {
      return false
    }
    if (filters.search && !matchesSearch(submission, filters.search)) return false
    return true
  })
}

export function summarizeSubmissionCounts(
  submissions: SheetSubmission[],
  hiddenSubmissionIds: string[] = [],
) {
  const normalize = (status: string) => {
    const lower = status.toLowerCase()
    if (lower === 'reviewing') return 'needs review'
    if (lower === 'converted') return 'added to sheet'
    return lower
  }

  const countStatus = (...labels: string[]) =>
    submissions.filter((submission) => labels.includes(normalize(submission.status))).length

  const hiddenCount = submissions.filter((submission) =>
    isLocallyHiddenSubmission(submission.id, hiddenSubmissionIds),
  ).length

  return {
    total: submissions.length,
    new: countStatus('new'),
    needsReview: countStatus('needs review', 'reviewing'),
    approved: countStatus('approved'),
    addedToSheet: countStatus('added to sheet', 'converted'),
    solved: countStatus('solved'),
    dismissed: countStatus('rejected'),
    hidden: hiddenCount,
  }
}

export function updateSubmissionById(
  submissions: SheetSubmission[],
  id: string,
  patch: Partial<SheetSubmission>,
): SheetSubmission[] {
  let updated = false
  const next = submissions.map((row) => {
    if (!submissionIdsMatch(row.id, id)) return row
    updated = true
    return { ...row, ...patch }
  })
  return updated ? next : submissions
}

export function submissionWasUpdated(
  before: SheetSubmission[],
  id: string,
  after: SheetSubmission[],
): boolean {
  const beforeRow = before.find((row) => submissionIdsMatch(row.id, id))
  const afterRow = after.find((row) => submissionIdsMatch(row.id, id))
  if (!beforeRow || !afterRow) return false
  return beforeRow !== afterRow
}
