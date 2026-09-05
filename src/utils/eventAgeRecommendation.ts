import type { Event } from '../types/event'
import {
  hasAllAgeBuckets,
  parseAgeBuckets,
} from './ageRange'

const AGE_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
}

function parseAgeToken(raw: string): number | null {
  const key = String(raw || '')
    .trim()
    .toLowerCase()
  if (AGE_WORDS[key] != null) return AGE_WORDS[key]
  const n = Number.parseInt(key, 10)
  return Number.isFinite(n) ? n : null
}

function formatYears(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10)
}

/** Coarse bucket bounds implied by Age Tags alone (no description precision). */
export function coarseBoundsForAgeRange(ageRange: string): { min: number; max: number } | null {
  const text = ageRange.trim()
  if (!text) return { min: 0, max: 5 }

  const buckets = parseAgeBuckets(text)
  if (hasAllAgeBuckets(buckets) || (buckets.has('0-2') && buckets.has('2-5'))) {
    return { min: 0, max: 5 }
  }
  if (buckets.has('0-2') && !buckets.has('2-5') && !buckets.has('5+')) {
    return { min: 0, max: 2 }
  }
  if (!buckets.has('0-2') && buckets.has('2-5')) {
    return { min: 2, max: buckets.has('5+') ? 12 : 5 }
  }
  if (buckets.has('5+') && !buckets.has('0-2') && !buckets.has('2-5')) {
    return { min: 5, max: 12 }
  }
  return null
}

function isExplicitAllAgesLabel(ageRange: string): boolean {
  return /\ball\s+ages?\b/i.test(ageRange.trim())
}

/**
 * Unambiguous age copy → parent-facing recommendation line.
 * Returns null when the text is missing or too vague to invent a range.
 */
export function extractSpecificAgeRecommendationFromText(text: string): string | null {
  const hay = String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
  if (!hay.trim()) return null

  // “18 to 36 months” / “ages 0-12 months”
  const monthsRange = hay.match(
    /\b(?:for\s+)?(?:ages?\s*)?(\d+)\s*(?:[-–]|to)\s*(\d+)\s*months?\b/,
  )
  if (monthsRange) {
    const a = Number.parseInt(monthsRange[1], 10)
    const b = Number.parseInt(monthsRange[2], 10)
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return `Best for ${Math.min(a, b)}–${Math.max(a, b)} months`
    }
  }

  // “under 12 months” / “babies under 12 months”
  const underMonths = hay.match(
    /\bunder(?:\s+the\s+age\s+of)?\s+(\d+)\s*months?\b/,
  )
  if (underMonths) {
    const n = Number.parseInt(underMonths[1], 10)
    if (Number.isFinite(n) && n > 0) return `Best for under ${n} months`
  }

  // Skip accompaniment “children under 10 must be accompanied…”
  const underYears = hay.match(
    /\bunder(?:\s+the\s+age\s+of)?\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)(?:\s*(?:years?|yrs?))?\b/,
  )
  if (underYears) {
    const around = hay.slice(
      Math.max(0, underYears.index! - 40),
      underYears.index! + underYears[0].length + 50,
    )
    if (!/\b(accompanied|accompany|with an adult|supervision)\b/.test(around)) {
      const n = parseAgeToken(underYears[1])
      if (n != null && n > 0) return `Best for under ${formatYears(n)}`
    }
  }

  // “ages 3 and up” / “for children ages 3 and up” / “3+”
  const andUp = hay.match(
    /\b(?:for\s+)?(?:children\s+)?(?:ages?\s*)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:\+|and\s+up)\b/,
  )
  if (andUp) {
    const n = parseAgeToken(andUp[1])
    if (n != null) return `Best for ages ${formatYears(n)}+`
  }

  const agesPlus = hay.match(
    /\b(?:for\s+)?ages?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*\+/,
  )
  if (agesPlus) {
    const n = parseAgeToken(agesPlus[1])
    if (n != null) return `Best for ages ${formatYears(n)}+`
  }

  // “older than 2 years” / “geared towards those older than 2”
  // Prefer this over a trailing “all ages are welcome”.
  const olderThan = hay.match(
    /\b(?:geared\s+towards?\s+(?:those\s+)?)?older\s+than\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)(?:\s*(?:years?|yrs?))?\b/,
  )
  if (olderThan) {
    const n = parseAgeToken(olderThan[1])
    if (n != null) return `Best for ages ${formatYears(n)}+`
  }

  // “early walkers, 1s, and 2s”
  const yearOldsList = hay.match(
    /\b(?:early\s+walkers?,?\s+(?:and\s+)?)?(\d+)s(?:\s*,\s*|\s+and\s+|\s*,\s*and\s+)(\d+)s(?:(?:\s*,\s*|\s+and\s+|\s*,\s*and\s+)(\d+)s)?\b/,
  )
  if (yearOldsList) {
    const ages = [yearOldsList[1], yearOldsList[2], yearOldsList[3]]
      .map((token) => parseAgeToken(token || ''))
      .filter((n): n is number => n != null && n >= 0 && n <= 12)
    if (ages.length >= 2) {
      const min = Math.min(...ages)
      const max = Math.max(...ages)
      return `Best for ages ${formatYears(min)}–${formatYears(max)}`
    }
  }

  // “for ages 2–5” / “recommended age is 2-8” / “ages 0 to 5” / “(0–2)”
  const range = hay.match(
    /\b(?:recommended\s+age(?:\s+is)?|best\s+for\s+ages?|preschoolers?\s+ages?|for\s+ages?|ages?)\s*(?:is\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:[-–]|to)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)(?:\s*(years?|yrs?))?\b/,
  )
  if (range) {
    const a = parseAgeToken(range[1])
    const b = parseAgeToken(range[2])
    if (a != null && b != null) {
      return `Best for ages ${formatYears(Math.min(a, b))}–${formatYears(Math.max(a, b))}`
    }
  }

  const parenRange = hay.match(
    /\(\s*(\d+)\s*[-–]\s*(\d+)\s*\)/,
  )
  if (parenRange) {
    const a = Number.parseInt(parenRange[1], 10)
    const b = Number.parseInt(parenRange[2], 10)
    if (Number.isFinite(a) && Number.isFinite(b) && a <= 12 && b <= 12) {
      return `Best for ages ${Math.min(a, b)}–${Math.max(a, b)}`
    }
  }

  // “suitable for children 3-5”
  const childrenRange = hay.match(
    /\b(?:suitable\s+for\s+)?children\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:[-–]|to)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/,
  )
  if (childrenRange) {
    const a = parseAgeToken(childrenRange[1])
    const b = parseAgeToken(childrenRange[2])
    if (a != null && b != null) {
      return `Best for ages ${formatYears(Math.min(a, b))}–${formatYears(Math.max(a, b))}`
    }
  }

  // “all ages welcome” — only when no more specific cue matched above
  if (/\ball\s+ages?\b/.test(hay)) return 'All ages'

  // Audience-only language when no numbers (last resort, still unambiguous)
  if (/\b(newborns?|infants?)\b/.test(hay) || (/\bbabies\b/.test(hay) && !/\btoddlers?\b/.test(hay))) {
    if (!/\b(preschool|kids?\b|children\b|grades?\b)\b/.test(hay)) {
      return 'Best for babies'
    }
  }
  if (/\btoddlers?\b/.test(hay) && !/\b(preschool|babies|infants?)\b/.test(hay)) {
    return 'Best for toddlers'
  }
  if (/\bpreschoolers?\b/.test(hay) && !/\b(toddlers?|babies|infants?)\b/.test(hay)) {
    return 'Best for preschoolers'
  }

  return null
}

function recommendationFromStructured(
  ageMin: number,
  ageMax: number,
  ageRange: string,
): string | null {
  if (!Number.isFinite(ageMin) || !Number.isFinite(ageMax) || ageMax < ageMin) return null

  // Only treat as All ages when the Age Tags field literally says so —
  // multi-bucket “0–2, 2–5, 5+” is a filter encoding, not a card recommendation.
  if (isExplicitAllAgesLabel(ageRange)) return 'All ages'

  const coarse = coarseBoundsForAgeRange(ageRange)
  const matchesCoarse =
    coarse != null && ageMin === coarse.min && ageMax === coarse.max

  // Open-ended / minimum age (e.g. ages 3+ stored as min=3, max=12)
  if (ageMax >= 12) {
    return `Best for ages ${formatYears(ageMin)}+`
  }

  // Precise bounds tighter than coarse Age Tags
  if (!matchesCoarse) {
    if (ageMin === ageMax) return `Best for age ${formatYears(ageMin)}`
    return `Best for ages ${formatYears(ageMin)}–${formatYears(ageMax)}`
  }

  // Structured data is only the broad filter bucket — not specific enough.
  return null
}

export type EventAgeRecommendation = {
  /** Line under date/time, or null when nothing reliable to show. */
  label: string | null
  /** When true, omit the broad Ages 0–2 / 2–5 image pill (avoid duplicate). */
  hideBroadAgePill: boolean
}

/**
 * Card age recommendation: structured ageMin/ageMax first when specific;
 * otherwise unambiguous description/tips; never invent from vague copy.
 * Filter buckets (0–2 / 2–5) are unchanged — callers keep using ageRange.
 */
function isAllAgesOnlyRecommendation(label: string): boolean {
  return /^all\s+ages\.?$/i.test(label.trim())
}

export function getEventAgeRecommendation(
  event: Pick<Event, 'ageRange' | 'ageMin' | 'ageMax' | 'description' | 'tips' | 'title'>,
): EventAgeRecommendation {
  const copy = [event.description, event.tips ?? '', event.title].filter(Boolean).join('\n')

  const fromStructured = recommendationFromStructured(event.ageMin, event.ageMax, event.ageRange)
  if (fromStructured && !isAllAgesOnlyRecommendation(fromStructured)) {
    return { label: fromStructured, hideBroadAgePill: true }
  }

  const fromText = extractSpecificAgeRecommendationFromText(copy)
  // “All ages welcome” in tips must not echo under an Ages field that already says All Ages.
  if (fromText && !isAllAgesOnlyRecommendation(fromText)) {
    return { label: fromText, hideBroadAgePill: true }
  }

  // No specific recommendation — keep existing broad age pill only.
  return { label: null, hideBroadAgePill: false }
}
