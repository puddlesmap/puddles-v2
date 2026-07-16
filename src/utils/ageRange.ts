export type AgeBucket = '0-2' | '2-5' | '5+'
export type AgeFilter = 'all' | '0-2' | '2-5'

export const PUBLIC_AGE_FILTER_OPTIONS: { key: AgeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '0-2', label: '0–2' },
  { key: '2-5', label: '2–5' },
]

function normalizePart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

export function parseAgeBuckets(raw: string): Set<AgeBucket> {
  const text = raw.trim()
  const buckets = new Set<AgeBucket>()

  if (!text) {
    buckets.add('0-2')
    buckets.add('2-5')
    return buckets
  }

  if (/all\s*ages?/i.test(text)) {
    buckets.add('0-2')
    buckets.add('2-5')
    buckets.add('5+')
    return buckets
  }

  for (const part of text.split(/[,;]/)) {
    const normalized = normalizePart(part)
    if (!normalized) continue
    if (normalized === '0-2' || normalized === '0–2') buckets.add('0-2')
    if (normalized === '2-5' || normalized === '2–5') buckets.add('2-5')
    if (normalized === '5+') buckets.add('5+')
  }

  if (buckets.size === 0) {
    const ranges = [...text.matchAll(/(\d+)\s*[-–]\s*(\d+)/g)].map((match) => [
      parseInt(match[1], 10),
      parseInt(match[2], 10),
    ])

    if (ranges.length > 0) {
      const min = Math.min(...ranges.map(([low]) => low))
      const max = Math.max(...ranges.map(([, high]) => high))
      if (min <= 2) buckets.add('0-2')
      if (min <= 5 && max >= 2) buckets.add('2-5')
      if (max > 5) buckets.add('5+')
    } else if (/^5\+$/i.test(normalizePart(text))) {
      buckets.add('5+')
    } else {
      buckets.add('0-2')
      buckets.add('2-5')
    }
  }

  return buckets
}

export function hasAllAgeBuckets(buckets: Set<AgeBucket>): boolean {
  return buckets.has('0-2') && buckets.has('2-5') && buckets.has('5+')
}

/** Events suitable for the public 0–5 site. Excludes 5+ only. */
export function isPublicAgeEligible(ageRange: string): boolean {
  const buckets = parseAgeBuckets(ageRange)
  if (buckets.size === 0) return true
  if (hasAllAgeBuckets(buckets)) return true
  return buckets.has('0-2') || buckets.has('2-5')
}

export function matchesPublicAgeFilter(ageRange: string, filter: AgeFilter): boolean {
  if (filter === 'all') return true

  const buckets = parseAgeBuckets(ageRange)
  if (hasAllAgeBuckets(buckets)) return true
  if (filter === '0-2') return buckets.has('0-2')
  if (filter === '2-5') return buckets.has('2-5')
  return false
}

export function getBrowseAgeChipLabel(age: AgeFilter): string {
  if (age === 'all') return 'Age'
  const option = PUBLIC_AGE_FILTER_OPTIONS.find((item) => item.key === age)
  return option ? `Age ${option.label}` : 'Age'
}

/** Short parent-facing label for event card age pills. */
export function getEventCardAgeLabel(ageRange: string): string {
  const text = ageRange.trim()
  if (!text) return 'All ages'

  if (/all\s*ages?/i.test(text)) return 'All ages'

  const buckets = parseAgeBuckets(text)
  if (hasAllAgeBuckets(buckets)) return 'All ages'

  if (buckets.has('0-2') && buckets.has('2-5') && !buckets.has('5+')) {
    return 'All ages'
  }

  if (buckets.size === 1) {
    if (buckets.has('0-2')) return 'Ages 0–2'
    if (buckets.has('2-5')) return 'Ages 2–5'
  }

  const compact = text.replace(/\s+/g, '')
  if (/^0[-–]5$/i.test(compact)) return 'All ages'
  if (/^0[-–]2$/i.test(compact)) return 'Ages 0–2'
  if (/^2[-–]5$/i.test(compact)) return 'Ages 2–5'

  return `Ages ${text.replace(/-/g, '–')}`
}

const MODAL_AGE_BUCKET_ORDER: AgeBucket[] = ['0-2', '2-5', '5+']

function formatAgeBucketLabel(bucket: AgeBucket): string {
  if (bucket === '0-2') return '0–2'
  if (bucket === '2-5') return '2–5'
  return '5+'
}

function isFullSiteAgeRange(buckets: Set<AgeBucket>, text: string): boolean {
  if (hasAllAgeBuckets(buckets)) return true
  if (buckets.has('0-2') && buckets.has('2-5') && !buckets.has('5+')) return true
  return /^0[-–]5$/i.test(text.replace(/\s+/g, ''))
}

/** Canonical bucket label for display and synced event data. */
export function formatPublicAgeRangeLabel(ageRange: string): string {
  const text = ageRange.trim()
  if (!text || /all\s*ages?/i.test(text)) return '0–2, 2–5, 5+'

  const buckets = parseAgeBuckets(text)
  if (isFullSiteAgeRange(buckets, text)) return '0–2, 2–5, 5+'

  const labels = MODAL_AGE_BUCKET_ORDER.filter((bucket) => buckets.has(bucket)).map(
    formatAgeBucketLabel,
  )
  if (labels.length === 0) return '0–2, 2–5, 5+'
  return labels.join(', ')
}

/**
 * Parent-facing age label for event detail / modal.
 * 0–5+ friendly ranges (all buckets, 0–2+2–5, or 0–5) show as All Ages.
 */
export function getEventModalAgeLabel(ageRange: string): string {
  const text = ageRange.trim()
  if (!text || /all\s*ages?/i.test(text)) return 'All Ages'

  const buckets = parseAgeBuckets(text)
  if (isFullSiteAgeRange(buckets, text)) return 'All Ages'

  return formatPublicAgeRangeLabel(ageRange)
}

/** Derive min/max for sync and display from bucket tags. */
export function ageBoundsFromRange(raw: string): { min: number; max: number; label: string } {
  const buckets = parseAgeBuckets(raw)
  const text = raw.trim()

  if (text) {
    return {
      min: buckets.has('0-2') ? 0 : buckets.has('2-5') ? 2 : 5,
      max: buckets.has('5+') && !buckets.has('0-2') && !buckets.has('2-5') ? 12 : 5,
      label: formatPublicAgeRangeLabel(text),
    }
  }

  return { min: 0, max: 5, label: '0–2, 2–5, 5+' }
}
