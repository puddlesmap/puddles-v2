export type SubmissionStatus =
  | 'New'
  | 'Needs review'
  | 'Approved'
  | 'Added to sheet'
  | 'Solved'
  | 'Rejected'
  | 'Reviewing'
  | 'Converted'
  | string

export type SheetSubmissionType = 'Event' | 'Idea' | string

export type ShareCostType = 'Free' | 'Paid / Ticketed' | 'Not sure'

export type ShareSignupRequirement =
  | 'Drop-in / just show up!'
  | 'RSVP recommended'
  | 'Registration required'
  | 'Not sure'

export type ShareAgeRange = '0–2' | '2–5' | '5+' | 'All ages' | 'Not sure'

/** Share form payload — activity tab. */
export interface ActivitySubmissionPayload {
  submissionType: 'Event'
  eventType: 'One-time event' | 'Recurring class'
  eventName: string
  city: string
  cityOther: string
  /** Combined place name, address, or neighborhood hint — reviewed manually in admin. */
  placeOrAddress: string
  venueId: string
  date: string
  recurringDay: string
  startTime: string
  endTime: string
  scheduleDescription: string
  ageRange: ShareAgeRange | ''
  link: string
  costType: ShareCostType | ''
  costDetail: string
  signupRequirement: ShareSignupRequirement | ''
  signupLinkInfo: string
  eventDescription: string
  parentTips: string
  submittedByEmail: string
  submittedAt: string
  /** Other-city submissions are intake-only — never auto-published. */
  reviewOnly: boolean
}

/** Share form payload — idea tab. */
export interface IdeaSubmissionPayload {
  submissionType: 'Idea'
  ideaTypes: string[]
  additionalInfo: string
  submittedByEmail: string
  submittedAt: string
}

/** Row from the Google Sheet Submissions tab. */
export interface SheetSubmission {
  id: string
  submittedAt: string
  submissionType: SheetSubmissionType
  status: SubmissionStatus
  eventType: string
  eventName: string
  locationName: string
  address: string
  city: string
  date: string
  startTime: string
  endTime: string
  ageRange: string
  costType: string
  costDetail: string
  cost: string
  signupRequirement: string
  signupLinkInfo: string
  eventDescription: string
  parentTips: string
  types: string
  link: string
  additionalInfo: string
  internalNotes: string
  convertedEventId: string
  submittedByEmail: string
}

export const SUBMISSION_STATUSES = [
  'New',
  'Needs review',
  'Approved',
  'Added to sheet',
  'Solved',
  'Rejected',
] as const

export type SubmissionStatusFilter = (typeof SUBMISSION_STATUSES)[number] | 'all' | 'hidden'

export const SOLVED_SUBMISSION_STATUS = 'Solved' as const

/** Legacy sheet status — older rows may still use Rejected. */
export const DISMISSED_SUBMISSION_STATUS = 'Rejected' as const

export function submissionIdsMatch(a: string, b: string): boolean {
  return a.trim() === b.trim()
}

export function isSolvedSubmission(status: string): boolean {
  return status.trim().toLowerCase() === SOLVED_SUBMISSION_STATUS.toLowerCase()
}

export function isDismissedSubmission(status: string): boolean {
  return status.trim().toLowerCase() === DISMISSED_SUBMISSION_STATUS.toLowerCase()
}

/** Archived in sheet — excluded from the active review queue. */
export function isArchivedSubmission(status: string): boolean {
  const lower = status.trim().toLowerCase()
  return lower === SOLVED_SUBMISSION_STATUS.toLowerCase() || lower === DISMISSED_SUBMISSION_STATUS.toLowerCase()
}

export function isLocallyHiddenSubmission(id: string, hiddenSubmissionIds: string[]): boolean {
  return hiddenSubmissionIds.some((hiddenId) => submissionIdsMatch(hiddenId, id))
}

/** Admin-facing label — sheet still stores Rejected for legacy dismissed rows. */
export function submissionStatusLabel(status: string): string {
  if (isDismissedSubmission(status)) return 'Dismissed'
  return status?.trim() || 'New'
}

export const SUBMISSION_TYPES = ['Event', 'Idea', 'All types'] as const
