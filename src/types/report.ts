export type OutdatedReportType =
  | 'cancelled'
  | 'wrong_time'
  | 'wrong_location'
  | 'broken_link'
  | 'no_longer_exists'
  | 'other'

export const OUTDATED_REPORT_OPTIONS: { value: OutdatedReportType; label: string }[] = [
  { value: 'cancelled', label: 'This event was cancelled' },
  { value: 'wrong_time', label: 'Time/date is wrong' },
  { value: 'wrong_location', label: 'Location is wrong' },
  { value: 'broken_link', label: 'Link is broken' },
  { value: 'no_longer_exists', label: 'This no longer exists' },
  { value: 'other', label: 'Other' },
]

export interface OutdatedReportPayload {
  eventId: string
  eventName: string
  reportType: OutdatedReportType
  userNote: string
  submittedAt: string
}
