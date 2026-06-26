import type { CsvColumn } from './exportCsv'
import type { Event } from '../types/event'
import type { SheetSubmission } from '../types/submission'

export const EVENT_EXPORT_COLUMNS: CsvColumn<Event>[] = [
  { key: 'title', label: 'Title', value: (row) => row.title },
  { key: 'venue', label: 'Venue', value: (row) => row.venue },
  { key: 'city', label: 'City', value: (row) => row.city },
  { key: 'date', label: 'Date', value: (row) => row.date },
  { key: 'startTime', label: 'Start Time', value: (row) => row.startTime },
  { key: 'endTime', label: 'End Time', value: (row) => row.endTime },
  { key: 'status', label: 'Status', value: (row) => row.status },
  { key: 'isLive', label: 'Is Live', value: (row) => row.isLive },
  { key: 'isPast', label: 'Is Past', value: (row) => row.isPast },
  { key: 'verifiedDate', label: 'Last Checked', value: (row) => row.verifiedDate },
  { key: 'types', label: 'Types', value: (row) => row.types.join('; ') },
  { key: 'eventUrl', label: 'Event URL', value: (row) => row.eventUrl },
  { key: 'id', label: 'Event ID', value: (row) => row.id },
]

export const SUBMISSION_EXPORT_COLUMNS: CsvColumn<SheetSubmission>[] = [
  { key: 'submittedAt', label: 'Submitted Date', value: (row) => row.submittedAt },
  { key: 'submissionType', label: 'Submission Type', value: (row) => row.submissionType },
  { key: 'status', label: 'Status', value: (row) => row.status },
  { key: 'eventType', label: 'Event Type', value: (row) => row.eventType },
  { key: 'eventName', label: 'Event Name', value: (row) => row.eventName },
  { key: 'locationName', label: 'Location Name', value: (row) => row.locationName },
  { key: 'city', label: 'City', value: (row) => row.city },
  { key: 'date', label: 'Date', value: (row) => row.date },
  { key: 'startTime', label: 'Start Time', value: (row) => row.startTime },
  { key: 'endTime', label: 'End Time', value: (row) => row.endTime },
  { key: 'ageRange', label: 'Age Range', value: (row) => row.ageRange },
  { key: 'link', label: 'Link', value: (row) => row.link },
  { key: 'costType', label: 'Cost Type', value: (row) => row.costType },
  { key: 'costDetail', label: 'Cost Detail', value: (row) => row.costDetail },
  {
    key: 'signupRequirement',
    label: 'Signup Requirement',
    value: (row) => row.signupRequirement,
  },
  { key: 'signupLinkInfo', label: 'Signup Link / Info', value: (row) => row.signupLinkInfo },
  { key: 'eventDescription', label: 'Event Description', value: (row) => row.eventDescription },
  { key: 'parentTips', label: 'Parent-to-Parent Tips', value: (row) => row.parentTips },
  { key: 'additionalInfo', label: 'Additional Info', value: (row) => row.additionalInfo },
  { key: 'submittedByEmail', label: 'Submitted By Email', value: (row) => row.submittedByEmail },
  { key: 'internalNotes', label: 'Internal Notes', value: (row) => row.internalNotes },
  { key: 'convertedEventId', label: 'Converted Event ID', value: (row) => row.convertedEventId },
  { key: 'id', label: 'Submission ID', value: (row) => row.id },
]

export function exportFilename(prefix: string, count: number): string {
  const date = new Date().toISOString().slice(0, 10)
  return `puddles-${prefix}-${count}-rows-${date}.csv`
}
