import type { Event } from '../types/event'
import { isPublicAgeEligible } from './ageRange'

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
  /\b(\d{1,2})\s*\+\s*(?:year[\s-]*olds?|yo|yrs?|only)\b/gi,
]

/** "+days", "+hours", etc. — not an age band (common in SCCLD accessibility boilerplate). */
const DURATION_AFTER_PLUS_RE =
  /^\s*(?:days?|hours?|hrs?|weeks?|months?|minutes?|mins?|business\s+days?)\b/i

function isLikelyAgePlusMention(text: string, match: RegExpExecArray): boolean {
  const after = text.slice(match.index + match[0].length)
  return !DURATION_AFTER_PLUS_RE.test(after)
}

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
      if (!isLikelyAgePlusMention(text, match)) continue
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

/** Fields used to decide whether an event/candidate is outside Puddles ages 0–5. */
export type AgeScopeInput = {
  ageRange?: string | null
  ageMin?: number | null
  ageMax?: number | null
  title?: string | null
  description?: string | null
  tips?: string | null
}

export type OutsidePuddlesAgeScopeMatch = {
  phrase: string
  note: string
  source: 'age_tags' | 'age_bounds' | 'copy'
}

/**
 * True when Age Tags are exclusive 5+, structured min/max have no overlap with 0–5,
 * or copy names an age band outside 0–5.
 */
export function findOutsidePuddlesAgeScope(
  fields: AgeScopeInput,
): OutsidePuddlesAgeScopeMatch | null {
  const ageRange = String(fields.ageRange ?? '').trim()
  if (ageRange && !isPublicAgeEligible(ageRange)) {
    return {
      phrase: ageRange,
      note: `Age Tags are “${ageRange}” (outside Puddles ages 0–5).`,
      source: 'age_tags',
    }
  }

  const min = fields.ageMin
  const max = fields.ageMax
  if (
    typeof min === 'number' &&
    typeof max === 'number' &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    isOutOfZeroToFiveRange(min, max)
  ) {
    const phrase = min === max ? `age ${min}` : `ages ${min}–${max}`
    return {
      phrase,
      note: `Structured ages are ${phrase} (outside Puddles ages 0–5).`,
      source: 'age_bounds',
    }
  }

  const text = [fields.title, fields.description, fields.tips].filter(Boolean).join('\n')
  const mentions = extractAgeMentions(text)
  const outOfScope = mentions.find((mention) => isOutOfZeroToFiveRange(mention.min, mention.max))
  if (outOfScope) {
    const tags = ageRange || '(none)'
    return {
      phrase: outOfScope.phrase,
      note: `Copy targets ${outOfScope.phrase} (outside ages 0–5). Age Tags say “${tags}”.`,
      source: 'copy',
    }
  }

  return null
}

export function isOutsidePuddlesAgeScope(fields: AgeScopeInput): boolean {
  return findOutsidePuddlesAgeScope(fields) != null
}

export interface OutOfAgeAudienceMatch {
  event: Event
  mention: ParsedAgeMention
  note: string
}

export function findOutOfAgeAudienceMatch(event: Event): OutOfAgeAudienceMatch | null {
  if (event.status === 'Hidden' || event.status === 'Expired' || event.status === 'Cancelled') return null

  const scope = findOutsidePuddlesAgeScope(event)
  if (!scope) return null

  const mention: ParsedAgeMention =
    scope.source === 'age_bounds' &&
    typeof event.ageMin === 'number' &&
    typeof event.ageMax === 'number'
      ? { min: event.ageMin, max: event.ageMax, phrase: scope.phrase }
      : scope.source === 'copy'
        ? { min: 6, max: 99, phrase: scope.phrase }
        : { min: 5, max: 99, phrase: scope.phrase }

  return {
    event,
    mention,
    note: scope.note,
  }
}

export function findOutOfAgeAudienceEvents(events: Event[]): OutOfAgeAudienceMatch[] {
  return events
    .map((event) => findOutOfAgeAudienceMatch(event))
    .filter((match): match is OutOfAgeAudienceMatch => match != null)
}

/** Public-site gate: exclusive 5+, older-only bounds, or out-of-scope copy. */
export function isOutOfAgeAudienceForPublic(event: Event): boolean {
  return findOutOfAgeAudienceMatch(event) != null
}
