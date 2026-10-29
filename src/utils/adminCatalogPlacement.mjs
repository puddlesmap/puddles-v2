/** Home & Browse is always on. Seasonal is an extra checkbox. */

export const ADMIN_CORE_CITIES = [
  'Palo Alto',
  'Los Altos',
  'Los Altos Hills',
  'Mountain View',
  'Sunnyvale',
]

export function browseCityBucket(city) {
  return ADMIN_CORE_CITIES.includes(String(city || '').trim()) ? 'core' : 'other'
}

export function browsePlacementLabel(city) {
  return browseCityBucket(city) === 'core'
    ? 'Home & Browse · Core city'
    : 'Home & Browse · Other cities'
}

/**
 * Suggest the seasonal checkbox. Home & Browse stays on either way.
 * Non-core cities stay unchecked unless the source already says seasonal.
 */
export function suggestIncludeInSeasonal(input = {}) {
  if (input.isSeasonal === true || input.isRegional === true) return true
  const id = String(input.id || '')
  if (id.startsWith('regional-') || id.startsWith('seasonal-')) return true
  const blob = [
    input.source,
    input.sourceName,
    input.sourceExcerpt,
    input.description,
    ...(Array.isArray(input.categoryTags) ? input.categoryTags : []),
    ...(Array.isArray(input.reviewReasons) ? input.reviewReasons : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return /\bseasonal\b/.test(blob)
}

export function includeInSeasonalFromCandidate(input = {}) {
  if (typeof input.includeInSeasonal === 'boolean') return input.includeInSeasonal
  if (input.placement === 'seasonal' || input.placement === 'drive') return true
  if (input.placement === 'browse') return false
  return suggestIncludeInSeasonal(input)
}

/** @deprecated use catalogFlagsFromCandidate */
export function seasonalFlags(includeInSeasonal) {
  return {
    isSeasonal: Boolean(includeInSeasonal),
    isRegional: false,
  }
}

function isWorthADriveCandidate(input = {}) {
  if (input.placement === 'drive' || input.isRegional === true) return true
  const id = String(input.id || '')
  if (id.startsWith('regional-')) return true
  const tags = Array.isArray(input.categoryTags) ? input.categoryTags : []
  if (tags.some((t) => /worth a drive/i.test(String(t)))) return true
  const blob = [input.source, input.sourceName, ...(Array.isArray(input.reviewReasons) ? input.reviewReasons : [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return /\bworth a drive\b|\bregional ·\b/.test(blob)
}

/** Flags applied when staging from Discovery inbox (Browse stays on for core via publish rules). */
export function catalogFlagsFromCandidate(candidate = {}, includeInSeasonal) {
  const include = Boolean(includeInSeasonal)
  const regional = isWorthADriveCandidate(candidate)
  return {
    isSeasonal: include,
    isRegional: include && regional,
  }
}

export function seasonalSectionForCandidate(candidate = {}) {
  return isWorthADriveCandidate(candidate) ? 'worthADrive' : 'closeToHome'
}
