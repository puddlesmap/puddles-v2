/** Infer Puddles age bands from free-text (description / tips). Shared by sync + discovery. */

const AGE_WORDS = {
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

function parseAgeToken(raw) {
  const key = String(raw || '')
    .trim()
    .toLowerCase()
  if (AGE_WORDS[key] != null) return AGE_WORDS[key]
  const n = Number.parseInt(key, 10)
  return Number.isFinite(n) ? n : null
}

function bandsFromInclusive(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < 0 || min > max) return null

  const bands = []
  // Overlap rules keep “under 2” as 0–2 only, and “ages 2–8” as 2–5, 5+.
  if (min < 2 && max > 0) bands.push('0–2')
  if (min < 5 && max > 2) bands.push('2–5')
  if (max > 5 || min >= 5) bands.push('5+')

  const unique = [...new Set(bands)]
  if (unique.length === 0) {
    if (max <= 2) return { ageRange: '0–2', ageMin: 0, ageMax: 2 }
    return null
  }

  return {
    ageRange: unique.join(', '),
    ageMin: Math.max(0, Math.floor(min)),
    ageMax: Math.max(0, Math.ceil(max)),
  }
}

/**
 * When copy names a specific age (e.g. “under the age of two”, “ages 2–8”,
 * “early walkers, 1s, and 2s”, “older than 2”), return Puddles Age Tags +
 * precise min/max. Otherwise null.
 */
export function inferAgeRangeFromText(text) {
  const hay = String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
  if (!hay.trim()) return null

  // “under the age of two” / “under 2 years” / “children under two”
  // Skip accompaniment rules (“children under 10 must be accompanied…”).
  const under = hay.match(
    /\bunder(?:\s+the\s+age\s+of)?\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)(?:\s*(?:years?|yrs?|months?))?\b/,
  )
  if (under) {
    const around = hay.slice(Math.max(0, under.index - 40), under.index + under[0].length + 50)
    if (!/\b(accompanied|accompany|with an adult|supervision)\b/.test(around)) {
      const n = parseAgeToken(under[1])
      if (n != null && n > 0) {
        return bandsFromInclusive(0, Math.max(0, n - 0.01))
      }
    }
  }

  // “geared towards those older than 2 years” / “older than 2”
  const olderThan = hay.match(
    /\b(?:geared\s+towards?\s+(?:those\s+)?)?older\s+than\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)(?:\s*(?:years?|yrs?))?\b/,
  )
  if (olderThan) {
    const n = parseAgeToken(olderThan[1])
    if (n != null && n >= 0) {
      return bandsFromInclusive(n + 0.01, 5)
    }
  }

  // “younger than 3” / “younger than three years”
  const youngerThan = hay.match(
    /\byounger\s+than\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)(?:\s*(?:years?|yrs?))?\b/,
  )
  if (youngerThan) {
    const n = parseAgeToken(youngerThan[1])
    if (n != null && n > 0) {
      return bandsFromInclusive(0, Math.max(0, n - 0.01))
    }
  }

  // “early walkers, 1s, and 2s” / “1s and 2s” / “for 1s, 2s, and 3s”
  const yearOldsList = hay.match(
    /\b(?:early\s+walkers?,?\s+(?:and\s+)?)?(\d+)s(?:\s*,\s*|\s+and\s+|\s*,\s*and\s+)(\d+)s(?:(?:\s*,\s*|\s+and\s+|\s*,\s*and\s+)(\d+)s)?\b/,
  )
  if (yearOldsList) {
    const ages = [yearOldsList[1], yearOldsList[2], yearOldsList[3]]
      .map((token) => parseAgeToken(token || ''))
      .filter((n) => n != null && n >= 0 && n <= 12)
    if (ages.length >= 2) {
      return bandsFromInclusive(Math.min(...ages), Math.max(...ages))
    }
  }

  // “grades 3–7” / “grade 3 to 7” → ages ≈ grade + 5 (grade 3 ≈ age 8)
  const grades = hay.match(/\bgrades?\s+(\d{1,2})\s*(?:[-–]|to)\s*(\d{1,2})\b/)
  if (grades) {
    const g1 = Number.parseInt(grades[1], 10)
    const g2 = Number.parseInt(grades[2], 10)
    if (Number.isFinite(g1) && Number.isFinite(g2) && g1 >= 0 && g2 >= 0 && g1 <= 12 && g2 <= 12) {
      return bandsFromInclusive(Math.min(g1, g2) + 5, Math.max(g1, g2) + 5)
    }
  }

  // “target age: 8–12” / “target ages 8 to 12 years”
  const targetAge = hay.match(
    /\btarget\s+ages?\s*:?\s*(\d{1,2})\s*(?:[-–]|to)\s*(\d{1,2})(?:\s*(?:years?|yrs?))?\b/,
  )
  if (targetAge) {
    const a = Number.parseInt(targetAge[1], 10)
    const b = Number.parseInt(targetAge[2], 10)
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return bandsFromInclusive(Math.min(a, b), Math.max(a, b))
    }
  }

  // “recommended age is 2-8” / “ages 2–5” / “ages 0-12 months” / “for ages 0 to 5”
  const range = hay.match(
    /\b(?:recommended\s+age(?:\s+is)?|best\s+for\s+ages?|for\s+ages?|ages?)\s*(?:is\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:[-–]|to)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s*(months?|mos?|years?|yrs?))?\b/,
  )
  if (range) {
    let a = parseAgeToken(range[1])
    let b = parseAgeToken(range[2])
    if (a != null && b != null) {
      const unit = (range[3] || 'years').toLowerCase()
      if (unit.startsWith('month') || unit.startsWith('mo')) {
        // 0–12 months → 0–1 years (not 0–12 years)
        a = a / 12
        b = b / 12
      }
      return bandsFromInclusive(Math.min(a, b), Math.max(a, b))
    }
  }

  // “suitable for children 3-5” / “children 3–5”
  const childrenRange = hay.match(
    /\b(?:suitable\s+for\s+)?children\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:[-–]|to)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/,
  )
  if (childrenRange) {
    const a = parseAgeToken(childrenRange[1])
    const b = parseAgeToken(childrenRange[2])
    if (a != null && b != null) {
      return bandsFromInclusive(Math.min(a, b), Math.max(a, b))
    }
  }

  // “for ages 3+” / “ages 3+”
  const agesPlus = hay.match(
    /\b(?:for\s+)?ages?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*\+/,
  )
  if (agesPlus) {
    const n = parseAgeToken(agesPlus[1])
    if (n != null && n >= 0) {
      return bandsFromInclusive(n, 12)
    }
  }

  // “for babies” / “newborns” alone — not “Baby-Sitters Club”
  if (
    /\b(babies|newborns?|infants?)\b/.test(hay) ||
    (/\bbaby\b/.test(hay) && !/\bbaby[- ]?sitters?\b/.test(hay))
  ) {
    if (!/\b(toddlers?|preschool|kids?\b|children\b)\b/.test(hay)) {
      return { ageRange: '0–2', ageMin: 0, ageMax: 2 }
    }
  }

  return null
}

export function isAgeTargetingSentence(sentence) {
  const hay = String(sentence || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
  if (!hay.trim()) return false
  if (/\bunder(?:\s+the\s+age\s+of)?\s+(\d+|one|two|three|four|five)\b/.test(hay)) return true
  if (/\bolder\s+than\s+(\d+|one|two|three|four|five)\b/.test(hay)) return true
  if (/\byounger\s+than\s+(\d+|one|two|three|four|five)\b/.test(hay)) return true
  if (/\bearly\s+walkers?\b/.test(hay) && /\b\d+s\b/.test(hay)) return true
  if (/\b\d+s(?:\s*,\s*|\s+and\s+)\d+s\b/.test(hay)) return true
  if (/\brecommended\s+age\b/.test(hay)) return true
  if (/\btarget\s+ages?\b/.test(hay) && /\d/.test(hay)) return true
  if (/\bgrades?\s+\d/.test(hay)) return true
  if (/\bsuitable\s+for\s+children\b/.test(hay) && /\d/.test(hay)) return true
  if (/\b(?:for\s+)?ages?\s*\d+\s*\+/.test(hay)) return true
  if (/\btargeted\s+to\s+children\b/.test(hay) && /\bage\b/.test(hay)) return true
  return false
}

/**
 * Prefer ages named in description/tips when present.
 * Returns null when copy does not name a range (caller keeps sheet ages).
 */
export function resolveAgeFromSheetAndText(description, tips = '') {
  return inferAgeRangeFromText([description, tips].filter(Boolean).join('\n'))
}

function isPublicAgeEligible(ageRange) {
  const text = String(ageRange || '').trim()
  if (!text) return true
  if (/all\s*ages?/i.test(text)) return true
  const buckets = new Set()
  for (const part of text.split(/[,;]/)) {
    const normalized = part.trim().toLowerCase().replace(/\s+/g, '')
    if (normalized === '0-2' || normalized === '0–2') buckets.add('0-2')
    if (normalized === '2-5' || normalized === '2–5') buckets.add('2-5')
    if (normalized === '5+') buckets.add('5+')
  }
  if (buckets.size === 0) return true
  if (buckets.has('0-2') && buckets.has('2-5') && buckets.has('5+')) return true
  return buckets.has('0-2') || buckets.has('2-5')
}

function isOutOfZeroToFiveRange(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false
  const low = Math.min(min, max)
  const high = Math.max(min, max)
  return !(low <= 5 && high >= 0)
}

/**
 * Exclusive 5+ tags, older-only min/max, or copy naming ages outside 0–5.
 * Used by discovery scrapers to skip non-curatable candidates.
 */
export function isOutsidePuddlesAgeScope(fields = {}) {
  const ageRange = String(fields.ageRange ?? '').trim()
  if (ageRange && !isPublicAgeEligible(ageRange)) return true

  const min = fields.ageMin
  const max = fields.ageMax
  if (
    typeof min === 'number' &&
    typeof max === 'number' &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    isOutOfZeroToFiveRange(min, max)
  ) {
    return true
  }

  const text = [fields.title, fields.description, fields.tips].filter(Boolean).join('\n')
  const hay = String(text || '')
  const rangeMentions = [
    ...hay.matchAll(/\bages?\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})\b/gi),
    ...hay.matchAll(/\b(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*(?:year[\s-]*olds?|yo|yrs?)\b/gi),
  ]
  for (const match of rangeMentions) {
    const a = Number(match[1])
    const b = Number(match[2])
    if (!Number.isFinite(a) || !Number.isFinite(b) || a > 21 || b > 21) continue
    if (isOutOfZeroToFiveRange(Math.min(a, b), Math.max(a, b))) return true
  }
  const plusMentions = [
    ...hay.matchAll(/\bages?\s+(\d{1,2})\s*\+/gi),
    ...hay.matchAll(/\b(\d{1,2})\s*\+\s*(?:year[\s-]*olds?|yo|yrs?|only)?\b/gi),
  ]
  for (const match of plusMentions) {
    const n = Number(match[1])
    if (Number.isFinite(n) && n > 5 && n <= 21) return true
  }
  return false
}
