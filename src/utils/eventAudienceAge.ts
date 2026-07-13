import type { Event } from '../types/event'

export interface ParsedAgeMention {
  min: number
  max: number
  phrase: string
}

const AGE_RANGE_PATTERNS: RegExp[] = [
  /\bages?\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})\b/gi,
  /\bfor\s+(?:kids|children|youth|teens?|artists?)\s+ages?\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})\b/gi,
  /\b(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*(?:year[\s-]*olds?|yo|yrs?)\b/gi,
]

const AGE_PLUS_PATTERNS: RegExp[] = [
  /\bages?\s+(\d{1,2})\s*\+\b/gi,
  /\b(\d{1,2})\s*\+\s*(?:year[\s-]*olds?|yo|yrs?|only)?\b/gi,
]

function overlapsZeroToFive(min: number, max: number): boolean {
  return min <= 5 && max >= 0
}

/** True when the mentioned age band has no overlap with ages 0–5. */
export function isOutOfZeroToFiveRange(min: number, max: number): boolean {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false
  const low = Math.min(min, max)
  const high = Math.max(min, max)
  return !overlapsZeroToFive(low, high)
}

export function extractAgeMentions(text: string): ParsedAgeMention[] {
  const mentions: ParsedAgeMention[] = []
  const seen = new Set<string>()

  for (const pattern of AGE_RANGE_PATTERNS) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const a = Number(match[1])
      const b = Number(match[2])
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue
      // Skip likely non-age ranges (e.g. years 2020-2026)
      if (a > 21 || b > 21) continue
      const min = Math.min(a, b)
      const max = Math.max(a, b)
      const phrase = match[0].trim()
      const key = `${min}-${max}:${phrase.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      mentions.push({ min, max, phrase })
    }
  }

  for (const pattern of AGE_PLUS_PATTERNS) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const min = Number(match[1])
      if (!Number.isFinite(min) || min > 21) continue
      const phrase = match[0].trim()
      const key = `${min}+:${phrase.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      mentions.push({ min, max: 99, phrase })
    }
  }

  return mentions
}

export interface OutOfAgeAudienceMatch {
  event: Event
  mention: ParsedAgeMention
  note: string
}

export function findOutOfAgeAudienceMatch(event: Event): OutOfAgeAudienceMatch | null {
  if (event.status === 'Hidden' || event.status === 'Expired') return null

  const text = [event.title, event.description].filter(Boolean).join('\n')
  const mentions = extractAgeMentions(text)
  const outOfScope = mentions.find((mention) => isOutOfZeroToFiveRange(mention.min, mention.max))
  if (!outOfScope) return null

  const tags = event.ageRange?.trim() || '(none)'
  return {
    event,
    mention: outOfScope,
    note: `Description targets ${outOfScope.phrase} (outside ages 0–5). Age Tags say “${tags}”.`,
  }
}

export function findOutOfAgeAudienceEvents(events: Event[]): OutOfAgeAudienceMatch[] {
  return events
    .map((event) => findOutOfAgeAudienceMatch(event))
    .filter((match): match is OutOfAgeAudienceMatch => match != null)
}

/** Public-site gate: hard out-of-age description mentions are not shown. */
export function isOutOfAgeAudienceForPublic(event: Event): boolean {
  return findOutOfAgeAudienceMatch(event) != null
}
