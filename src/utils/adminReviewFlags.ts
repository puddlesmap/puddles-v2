import type { Event } from '../types/event'
import {
  findDuplicateClusters,
  type DuplicateCluster,
} from './eventDuplicates'
import { findOutOfAgeAudienceMatch } from './eventAudienceAge'

export type AdminReviewFlagType = 'duplicate' | 'out_of_age' | 'out_of_area' | 'field_mismatch'

export type AdminReviewFlagSeverity = 'high' | 'medium'

export interface AdminReviewFlag {
  id: string
  type: AdminReviewFlagType
  severity: AdminReviewFlagSeverity
  title: string
  note: string
  evidence: string
  eventIds: string[]
  /** Present when type === 'duplicate' */
  clusterId?: string
}

export const LAUNCH_CITIES = ['Palo Alto', 'Los Altos', 'Mountain View'] as const

const OUTSIDE_CITY_HINTS = [
  'san francisco',
  'san jose',
  'oakland',
  'berkeley',
  'sunnyvale',
  'cupertino',
  'redwood city',
  'san mateo',
  'fremont',
  'santa clara',
  'milpitas',
  'campbell',
  'saratoga',
  'san carlos',
]

function isCandidateStatus(event: Event): boolean {
  return event.status === 'Published' || event.status === 'Draft'
}

function collectDuplicateFlags(events: Event[]): AdminReviewFlag[] {
  return findDuplicateClusters(events).map((cluster) => ({
    id: `duplicate:${cluster.id}`,
    type: 'duplicate' as const,
    severity: 'high' as const,
    title: cluster.winner.title,
    note: `Possible duplicate group (${cluster.members.length} listings). Keep “${cluster.winner.title}” and hide the rest.`,
    evidence:
      cluster.matchReason === 'unique-url'
        ? `Same official URL · winner score reasons: ${cluster.winnerReasons.join('; ')}`
        : `Same schedule · winner score reasons: ${cluster.winnerReasons.join('; ')}`,
    eventIds: cluster.members.map((event) => event.id),
    clusterId: cluster.id,
  }))
}

function collectOutOfAgeFlags(events: Event[]): AdminReviewFlag[] {
  const flags: AdminReviewFlag[] = []
  for (const event of events) {
    if (!isCandidateStatus(event)) continue
    const match = findOutOfAgeAudienceMatch(event)
    if (!match) continue
    flags.push({
      id: `out_of_age:${event.id}`,
      type: 'out_of_age',
      severity: 'high',
      title: event.title,
      note: match.note,
      evidence: `Matched “${match.mention.phrase}” · Age Tags: ${event.ageRange || '—'}`,
      eventIds: [event.id],
    })
  }
  return flags
}

function addressLooksOutsideLaunchArea(address: string): boolean {
  const lower = address.toLowerCase()
  if (!lower.trim()) return false
  // If address mentions a launch city, treat as in-area.
  if (LAUNCH_CITIES.some((city) => lower.includes(city.toLowerCase()))) return false
  return OUTSIDE_CITY_HINTS.some((hint) => lower.includes(hint))
}

function collectOutOfAreaFlags(events: Event[]): AdminReviewFlag[] {
  const flags: AdminReviewFlag[] = []
  for (const event of events) {
    if (!isCandidateStatus(event)) continue

    const cityOk = (LAUNCH_CITIES as readonly string[]).includes(event.city)
    const addressOutside = addressLooksOutsideLaunchArea(event.address || '')

    if (cityOk && !addressOutside) continue

    const reasons: string[] = []
    if (!cityOk) reasons.push(`city “${event.city}” is outside launch cities`)
    if (addressOutside) reasons.push('address mentions a non-launch city')

    flags.push({
      id: `out_of_area:${event.id}`,
      type: 'out_of_area',
      severity: cityOk ? 'medium' : 'high',
      title: event.title,
      note: `Event may be outside Puddles launch area (${LAUNCH_CITIES.join(' · ')}).`,
      evidence: `${reasons.join('; ')} · ${event.venue} · ${event.address || 'no address'}`,
      eventIds: [event.id],
    })
  }
  return flags
}

function descriptionHasDollarPrice(text: string): boolean {
  return /(?:costs?|price[sd]?|tickets?|fee)\s*\$\s*\d+/i.test(text) || /\$\s*\d{2,}/.test(text)
}

function collectFieldMismatchFlags(events: Event[]): AdminReviewFlag[] {
  const flags: AdminReviewFlag[] = []
  for (const event of events) {
    if (!isCandidateStatus(event)) continue

    const description = event.description || ''
    if (event.cost === 'Free' && descriptionHasDollarPrice(description)) {
      const priceMatch = description.match(/\$\s*\d[\d,]*(?:\.\d+)?/)
      flags.push({
        id: `field_mismatch:cost:${event.id}`,
        type: 'field_mismatch',
        severity: 'medium',
        title: event.title,
        note: 'Cost tag says Free, but the description mentions a dollar price.',
        evidence: `Cost: Free · description has “${priceMatch?.[0] ?? '$…'}”`,
        eventIds: [event.id],
      })
    }
  }
  return flags
}

const SEVERITY_ORDER: Record<AdminReviewFlagSeverity, number> = { high: 0, medium: 1 }

const TYPE_ORDER: Record<AdminReviewFlagType, number> = {
  duplicate: 0,
  out_of_age: 1,
  out_of_area: 2,
  field_mismatch: 3,
}

export function collectAdminReviewFlags(events: Event[]): AdminReviewFlag[] {
  const flags = [
    ...collectDuplicateFlags(events),
    ...collectOutOfAgeFlags(events),
    ...collectOutOfAreaFlags(events),
    ...collectFieldMismatchFlags(events),
  ]

  return flags.sort((a, b) => {
    const severity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    if (severity !== 0) return severity
    const type = TYPE_ORDER[a.type] - TYPE_ORDER[b.type]
    if (type !== 0) return type
    return a.title.localeCompare(b.title)
  })
}

export function fingerprintAdminReviewFlags(flags: AdminReviewFlag[]): string {
  return flags
    .map((flag) => flag.id)
    .sort()
    .join('|')
}

export function adminReviewFlagsEmailSummary(flags: AdminReviewFlag[]): {
  subject: string
  body: string
  flagCount: number
} {
  const flagCount = flags.length
  const subject = `Puddles: ${flagCount} item${flagCount === 1 ? '' : 's'} need attention`

  const lines = [
    `Found ${flagCount} item${flagCount === 1 ? '' : 's'} that need attention in Admin → Events → Needs attention.`,
    '',
  ]

  for (const flag of flags) {
    lines.push(`--- [${flag.type}] ${flag.title} ---`)
    lines.push(flag.note)
    lines.push(`Evidence: ${flag.evidence}`)
    lines.push(`Event IDs: ${flag.eventIds.join(', ')}`)
    lines.push('')
  }

  lines.push('Review in Admin before hiding or editing the sheet.')

  return { subject, body: lines.join('\n'), flagCount }
}

export function findDuplicateClusterForFlag(
  events: Event[],
  flag: AdminReviewFlag,
): DuplicateCluster | undefined {
  if (flag.type !== 'duplicate' || !flag.clusterId) return undefined
  return findDuplicateClusters(events).find((cluster) => cluster.id === flag.clusterId)
}

export const ADMIN_REVIEW_FLAG_LABELS: Record<AdminReviewFlagType, string> = {
  duplicate: 'Duplicate',
  out_of_age: 'Out of age',
  out_of_area: 'Out of area',
  field_mismatch: 'Mismatch',
}
