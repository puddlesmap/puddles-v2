import type { Event } from '../types/event'

const GENERIC_EVENT_URL_SLUGS = new Set(['events-calendar', 'events', 'calendar', 'event'])
const TIME_MATCH_TOLERANCE_MINUTES = 30
const CANDIDATE_STATUSES = new Set(['Published', 'Draft'])

export interface EventDetailScoreBreakdown {
  total: number
  factors: string[]
}

export interface DuplicateCluster {
  id: string
  matchReason: 'schedule' | 'unique-url'
  key: string
  winner: Event
  losers: Event[]
  members: Event[]
  winnerReasons: string[]
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseMinutes(time: string): number | null {
  const match = String(time ?? '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

export function eventUrlSlug(url?: string): string {
  const trimmed = url?.trim()
  if (!trimmed || trimmed === '#') return ''
  try {
    const parsed = new URL(trimmed)
    const last = parsed.pathname.split('/').filter(Boolean).pop() ?? ''
    return last.split('?')[0]?.toLowerCase() ?? ''
  } catch {
    return (
      trimmed
        .split('/')
        .filter(Boolean)
        .pop()
        ?.split('?')[0]
        ?.toLowerCase() ?? ''
    )
  }
}

/** Bibliocommons-style hex ids count as unique event URLs; series landing pages do not. */
export function isUniqueEventUrl(url?: string): boolean {
  const slug = eventUrlSlug(url)
  if (!slug) return false
  if (GENERIC_EVENT_URL_SLUGS.has(slug)) return false
  if (/^\d+$/.test(slug)) return false
  if (/^[a-f0-9]{20,}$/i.test(slug)) return true
  return false
}

export function normalizeEventKey(
  event: Pick<Event, 'title' | 'venue' | 'city' | 'date' | 'startTime'>,
): string {
  const minutes = parseMinutes(event.startTime)
  const rounded =
    minutes == null ? 'na' : String(Math.round(minutes / TIME_MATCH_TOLERANCE_MINUTES))
  return [
    slugify(event.title),
    slugify(event.venue || event.city),
    slugify(event.city),
    event.date,
    rounded,
  ].join('|')
}

export function eventDetailScore(event: Event): EventDetailScoreBreakdown {
  const factors: string[] = []
  let total = 0

  const descriptionLength = event.description?.trim().length ?? 0
  if (descriptionLength > 0) {
    const points = Math.min(40, Math.floor(descriptionLength / 25))
    total += points
    factors.push(`description (${descriptionLength} chars)`)
  }

  const tipsLength = event.tips?.trim().length ?? 0
  if (tipsLength > 0) {
    const points = Math.min(25, 10 + Math.floor(tipsLength / 40))
    total += points
    factors.push(`tips (${tipsLength} chars)`)
  }

  if (event.room?.trim()) {
    total += 8
    factors.push('has room')
  }

  if (event.imageUrl?.trim() && !event.imageUrl.includes('placeholder')) {
    total += 10
    factors.push('has image')
  }

  if (event.ageRange?.trim() && event.ageRange !== 'All ages') {
    total += 4
    factors.push('age range')
  }

  if (event.types?.length) {
    total += Math.min(8, event.types.length * 2)
    factors.push(`types (${event.types.length})`)
  }

  if (event.cost?.trim()) {
    total += 2
    factors.push('cost')
  }

  if (isUniqueEventUrl(event.eventUrl)) {
    total += 12
    factors.push('unique official URL')
  } else if (event.eventUrl?.trim() && event.eventUrl !== '#') {
    total += 3
    factors.push('event URL')
  }

  if (event.status === 'Published') {
    total += 15
    factors.push('Published')
  } else if (event.status === 'Draft') {
    total += 5
    factors.push('Draft')
  }

  if (event.verifiedDate?.trim()) {
    total += 4
    factors.push(`verified ${event.verifiedDate}`)
  }

  if (event.address?.trim()) {
    total += 3
    factors.push('address')
  }

  return { total, factors }
}

function timesWithinTolerance(a: Event, b: Event): boolean {
  const aMin = parseMinutes(a.startTime)
  const bMin = parseMinutes(b.startTime)
  if (aMin == null || bMin == null) return a.startTime === b.startTime
  return Math.abs(aMin - bMin) <= TIME_MATCH_TOLERANCE_MINUTES
}

function softMatch(a: Event, b: Event): boolean {
  if (a.date !== b.date) return false
  if (slugify(a.title) !== slugify(b.title)) return false

  const venueA = slugify(a.venue)
  const venueB = slugify(b.venue)
  if (venueA && venueB) {
    if (venueA !== venueB) return false
  } else if (slugify(a.city) !== slugify(b.city)) {
    return false
  }

  return timesWithinTolerance(a, b)
}

function pickWinner(members: Event[]): { winner: Event; reasons: string[] } {
  const scored = members
    .map((event) => ({ event, score: eventDetailScore(event) }))
    .sort((a, b) => {
      if (b.score.total !== a.score.total) return b.score.total - a.score.total
      const aVerified = a.event.verifiedDate || ''
      const bVerified = b.event.verifiedDate || ''
      if (aVerified !== bVerified) return bVerified.localeCompare(aVerified)
      return a.event.id.localeCompare(b.event.id)
    })

  const best = scored[0]!
  return {
    winner: best.event,
    reasons: [`score ${best.score.total}`, ...best.score.factors.slice(0, 4)],
  }
}

function buildCluster(
  members: Event[],
  matchReason: DuplicateCluster['matchReason'],
  key: string,
): DuplicateCluster | null {
  if (members.length < 2) return null
  const unique = Array.from(new Map(members.map((event) => [event.id, event])).values())
  if (unique.length < 2) return null

  const { winner, reasons } = pickWinner(unique)
  const losers = unique.filter((event) => event.id !== winner.id)

  return {
    id: `${matchReason}:${key}`,
    matchReason,
    key,
    winner,
    losers,
    members: [winner, ...losers],
    winnerReasons: reasons,
  }
}

function isCandidate(event: Event): boolean {
  return CANDIDATE_STATUSES.has(event.status)
}

/**
 * Detect duplicate groups among Published/Draft events.
 * Soft key: title + venue/city + date + start time (±30m).
 * Hard key: shared unique official URL (Bibliocommons hex).
 */
export function findDuplicateClusters(events: Event[]): DuplicateCluster[] {
  const candidates = events.filter(isCandidate)
  const clusters: DuplicateCluster[] = []
  const claimed = new Set<string>()

  const byUniqueUrl = new Map<string, Event[]>()
  for (const event of candidates) {
    if (!isUniqueEventUrl(event.eventUrl)) continue
    const slug = eventUrlSlug(event.eventUrl)
    const list = byUniqueUrl.get(slug) ?? []
    list.push(event)
    byUniqueUrl.set(slug, list)
  }

  for (const [slug, group] of byUniqueUrl) {
    const cluster = buildCluster(group, 'unique-url', slug)
    if (!cluster) continue
    clusters.push(cluster)
    for (const member of cluster.members) claimed.add(member.id)
  }

  const remaining = candidates.filter((event) => !claimed.has(event.id))
  const softBuckets = new Map<string, Event[]>()

  for (const event of remaining) {
    // Bucket by title+date first, then refine with venue/time in pairwise merge.
    const bucketKey = `${slugify(event.title)}|${event.date}`
    const list = softBuckets.get(bucketKey) ?? []
    list.push(event)
    softBuckets.set(bucketKey, list)
  }

  for (const [bucketKey, group] of softBuckets) {
    if (group.length < 2) continue

    const used = new Set<string>()
    for (let i = 0; i < group.length; i++) {
      const seed = group[i]!
      if (used.has(seed.id)) continue
      const members = [seed]
      used.add(seed.id)

      for (let j = i + 1; j < group.length; j++) {
        const other = group[j]!
        if (used.has(other.id)) continue
        if (softMatch(seed, other) || members.some((member) => softMatch(member, other))) {
          members.push(other)
          used.add(other.id)
        }
      }

      const key = normalizeEventKey(seed)
      const cluster = buildCluster(members, 'schedule', `${bucketKey}|${key}`)
      if (cluster) clusters.push(cluster)
    }
  }

  return clusters.sort((a, b) => b.members.length - a.members.length || a.key.localeCompare(b.key))
}

export function eventsInDuplicateClusters(events: Event[]): Event[] {
  const clusters = findDuplicateClusters(events)
  const ids = new Set(clusters.flatMap((cluster) => cluster.members.map((event) => event.id)))
  return events.filter((event) => ids.has(event.id))
}

function categorySlugSet(event: Event): Set<string> {
  const slugs = new Set<string>()
  for (const value of [...(event.types ?? []), ...(event.categoryTags ?? [])]) {
    const slug = slugify(value)
    if (slug) slugs.add(slug)
  }
  return slugs
}

function sharesCategory(a: Event, b: Event): boolean {
  const setB = categorySlugSet(b)
  for (const slug of categorySlugSet(a)) {
    if (setB.has(slug)) return true
  }
  return false
}

function sharesEventUrl(a: Event, b: Event): boolean {
  const urlA = a.eventUrl?.trim().toLowerCase()
  const urlB = b.eventUrl?.trim().toLowerCase()
  if (!urlA || !urlB || urlA === '#' || urlB === '#') return false
  return urlA === urlB
}

/**
 * Same-slot duplicate: same venue + date, start times within tolerance, even when
 * titles differ (e.g. a generic recurring "Outdoor Storytime" vs a specific guest
 * "Storytime with … , Furious Turtle"). A shared category or the same series URL
 * guards against collapsing genuinely different concurrent programs at one venue.
 */
function isSameSlotDuplicate(a: Event, b: Event): boolean {
  if (a.date !== b.date) return false
  const venueA = slugify(a.venue)
  const venueB = slugify(b.venue)
  if (!venueA || venueA !== venueB) return false
  if (!timesWithinTolerance(a, b)) return false
  return sharesCategory(a, b) || sharesEventUrl(a, b)
}

/**
 * Collapse same-slot duplicates for public display: within each venue+date bucket,
 * merge events that occupy the same time slot and keep only the richest one
 * (highest detail score), suppressing the thinner generic copies.
 */
export function collapseSameSlotDuplicates(events: Event[]): Event[] {
  const buckets = new Map<string, Event[]>()
  for (const event of events) {
    const venue = slugify(event.venue)
    if (!venue) continue
    const key = `${venue}|${event.date}`
    const list = buckets.get(key) ?? []
    list.push(event)
    buckets.set(key, list)
  }

  const suppressed = new Set<string>()
  for (const group of buckets.values()) {
    if (group.length < 2) continue
    const used = new Set<string>()
    for (let i = 0; i < group.length; i++) {
      const seed = group[i]!
      if (used.has(seed.id)) continue
      const members = [seed]
      used.add(seed.id)

      for (let j = i + 1; j < group.length; j++) {
        const other = group[j]!
        if (used.has(other.id)) continue
        if (members.some((member) => isSameSlotDuplicate(member, other))) {
          members.push(other)
          used.add(other.id)
        }
      }

      if (members.length < 2) continue
      const { winner } = pickWinner(members)
      for (const member of members) {
        if (member.id !== winner.id) suppressed.add(member.id)
      }
    }
  }

  if (suppressed.size === 0) return events
  return events.filter((event) => !suppressed.has(event.id))
}

export function clusterSummaryForEmail(clusters: DuplicateCluster[]): {
  subject: string
  body: string
  clusterCount: number
} {
  const clusterCount = clusters.length
  const subject = `Puddles: ${clusterCount} possible duplicate event group${clusterCount === 1 ? '' : 's'}`

  const lines = [
    `Found ${clusterCount} possible duplicate group${clusterCount === 1 ? '' : 's'} in the Events catalog.`,
    '',
    'Review in Admin → Events → Possible duplicates, then Keep winner / hide others.',
    '',
  ]

  clusters.forEach((cluster, index) => {
    lines.push(`--- Group ${index + 1} (${cluster.matchReason}) ---`)
    lines.push(
      `KEEP: ${cluster.winner.title} · ${cluster.winner.date} · ${cluster.winner.venue} · ${cluster.winner.city}`,
    )
    lines.push(`  id: ${cluster.winner.id}`)
    lines.push(`  why: ${cluster.winnerReasons.join('; ')}`)
    for (const loser of cluster.losers) {
      const loserScore = eventDetailScore(loser).total
      lines.push(
        `HIDE: ${loser.title} · ${loser.date} · ${loser.venue} · id ${loser.id} (score ${loserScore})`,
      )
    }
    lines.push('')
  })

  return { subject, body: lines.join('\n'), clusterCount }
}
