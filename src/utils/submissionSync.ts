import type { SheetSubmission } from '../types/submission'
import {
  SHEET_SUBMISSIONS_CSV_PROXY_PATH,
} from '../data/sheet-source'
import { parseCsv, rowsToObjects } from './csv'

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function pickField(record: Record<string, string>, aliases: string[]): string {
  for (const [header, value] of Object.entries(record)) {
    const key = normalizeHeader(header)
    if (aliases.some((alias) => key === alias || key.includes(alias))) {
      return String(value ?? '').trim()
    }
  }
  return ''
}

function parseEventTypeFromNotes(notes: string): string {
  const match = notes.match(/(One-time event|Recurring class)/)
  return match?.[1] ?? ''
}

function normalizeSubmissionStatus(raw: string): string {
  const value = raw.trim()
  if (!value) return 'New'
  const lower = value.toLowerCase()
  if (lower === 'reviewing') return 'Needs review'
  if (lower === 'converted') return 'Added to sheet'
  return value
}

function mapRecord(record: Record<string, string>): SheetSubmission | null {
  const eventName = pickField(record, ['event name', 'idea summary'])
  const submissionType = pickField(record, ['submission type']) || 'Event'
  const submittedAt = pickField(record, ['submitted date', 'submitted at'])
  const id =
    pickField(record, ['submission id']) ||
    `${submissionType}-${submittedAt}-${eventName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)

  if (!id && !eventName && !submittedAt) return null

  return {
    id: id || `submission-${Date.now()}`,
    submittedAt,
    submissionType,
    status: normalizeSubmissionStatus(pickField(record, ['status']) || 'New'),
    eventType:
      pickField(record, ['event type']) ||
      parseEventTypeFromNotes(pickField(record, ['internal notes'])),
    eventName,
    locationName: pickField(record, ['location name']),
    address: pickField(record, ['address']),
    city: pickField(record, ['city']),
    date: pickField(record, ['date']),
    startTime: pickField(record, ['start time']),
    endTime: pickField(record, ['end time']),
    ageRange: pickField(record, ['age range']),
    costType: pickField(record, ['cost type']),
    costDetail: pickField(record, ['cost detail']),
    cost: pickField(record, ['cost']),
    signupRequirement: pickField(record, ['signup requirement', 'registration requirement']),
    signupLinkInfo: pickField(record, ['signup link / info', 'registration link / info']),
    eventDescription: pickField(record, ['event description']),
    parentTips: pickField(record, ['parent-to-parent tips', 'parent tips']),
    types: pickField(record, ['category / types', 'category', 'types', 'idea types']),
    link: pickField(record, ['link']),
    additionalInfo:
      pickField(record, ['parent-to-parent tips', 'parent tips']) ||
      pickField(record, ['additional info']),
    internalNotes: pickField(record, ['internal notes']),
    convertedEventId: pickField(record, ['converted event id']),
    submittedByEmail: pickField(record, ['submitted by email', 'email']),
    requestedLocation: pickField(record, ['requested location']),
    sourceContext: pickField(record, ['source context']),
    selectedCity: pickField(record, ['selected city']),
  }
}

async function fetchSubmissionsCsv(): Promise<string> {
  const response = await fetch(SHEET_SUBMISSIONS_CSV_PROXY_PATH, {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`Submissions fetch failed (${response.status})`)
  }
  return await response.text()
}

export function parseSubmissionsCsv(csvText: string): SheetSubmission[] {
  const rows = rowsToObjects(parseCsv(csvText))
  return rows
    .map(mapRecord)
    .filter((submission): submission is SheetSubmission => submission !== null)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export async function refreshSubmissionsFromSheet(): Promise<{
  submissions: SheetSubmission[]
  refreshedAt: string
}> {
  const csvText = await fetchSubmissionsCsv()
  return { submissions: parseSubmissionsCsv(csvText), refreshedAt: new Date().toISOString() }
}

export const ADMIN_SUBMISSIONS_REFRESH_KEY = 'puddles-admin-submissions-refresh'

export interface AdminSubmissionsCache {
  submissions: SheetSubmission[]
  refreshedAt: string
  hiddenSubmissionIds?: string[]
}

export function loadCachedSubmissionsRefresh(): AdminSubmissionsCache | null {
  try {
    const raw = localStorage.getItem(ADMIN_SUBMISSIONS_REFRESH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdminSubmissionsCache
    if (!Array.isArray(parsed.submissions) || !parsed.refreshedAt) return null
    return {
      submissions: parsed.submissions,
      refreshedAt: parsed.refreshedAt,
      hiddenSubmissionIds: Array.isArray(parsed.hiddenSubmissionIds)
        ? parsed.hiddenSubmissionIds
        : [],
    }
  } catch {
    return null
  }
}

export function saveCachedSubmissionsRefresh(payload: AdminSubmissionsCache) {
  localStorage.setItem(ADMIN_SUBMISSIONS_REFRESH_KEY, JSON.stringify(payload))
}

export function persistAdminSubmissionsCache(
  submissions: SheetSubmission[],
  hiddenSubmissionIds: string[],
  refreshedAt: string | null,
) {
  saveCachedSubmissionsRefresh({
    submissions,
    refreshedAt: refreshedAt ?? new Date().toISOString(),
    hiddenSubmissionIds,
  })
}
