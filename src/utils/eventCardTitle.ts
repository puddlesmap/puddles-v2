import type { Event } from '../types/event'

/** Skip appending when the original title already fills ~2 lines at 15px on a phone card. */
const TITLE_ALREADY_LONG_CHARS = 40
/** Skip appending when `title · venue` would likely overflow the 2-line title block. */
const COMBINED_TITLE_MAX_CHARS = 70

const GENERIC_PLACE_SUFFIXES = [
  'recreation center',
  'community center',
  'public library',
  'regional park',
  'community park',
  'playground',
  'play garden',
  'library',
  'gardens',
  'garden',
  'farms',
  'farm',
  'park',
  'center',
  'school',
  'church',
  'museum',
  'studio',
  'studios',
  'zoo',
] as const

function normalizePlace(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Distinctive venue core after stripping generic place suffixes.
 * Returns null when the leftover is empty or too short.
 * City-named libraries/parks still count (e.g. "Mountain View" from
 * "Mountain View Library") so cards can append the full venue.
 */
export function distinctiveVenueCore(venue: string, city = ''): string | null {
  let core = normalizePlace(venue)
  if (!core) return null

  let stripped = true
  while (stripped) {
    stripped = false
    for (const suffix of GENERIC_PLACE_SUFFIXES) {
      if (core === suffix) {
        core = ''
        stripped = true
        break
      }
      if (core.endsWith(` ${suffix}`)) {
        core = core.slice(0, core.length - suffix.length - 1).trim()
        stripped = true
        break
      }
    }
  }

  if (!core) return null

  const cityNorm = normalizePlace(city)
  if (cityNorm && normalizePlace(venue) === cityNorm) return null

  const words = core.split(' ')
  if (words.length < 2 && core.length < 8) return null

  return core
}

export type EventCardTitleParts = {
  title: string
  venue: string | null
}

/**
 * Card-only title parts: append venue when it adds place context.
 * Never use this on the event detail heading.
 */
export function formatEventCardTitleParts(
  event: Pick<Event, 'title' | 'venue' | 'city'>,
): EventCardTitleParts {
  const title = event.title.trim()
  const venue = event.venue?.trim() ?? ''
  if (!title || !venue) return { title: title || event.title, venue: null }

  const titleNorm = normalizePlace(title)
  const venueNorm = normalizePlace(venue)
  if (!venueNorm) return { title, venue: null }
  if (titleNorm.includes(venueNorm)) return { title, venue: null }

  const core = distinctiveVenueCore(venue, event.city ?? '')
  if (core && titleNorm.includes(core)) return { title, venue: null }

  if (title.length >= TITLE_ALREADY_LONG_CHARS) return { title, venue: null }

  const candidate = `${title} · ${venue}`
  if (candidate.length > COMBINED_TITLE_MAX_CHARS) return { title, venue: null }

  return { title, venue }
}

/** Card-only title: `{title} · {venue}` when the suffix is useful. */
export function formatEventCardTitle(
  event: Pick<Event, 'title' | 'venue' | 'city'>,
): string {
  const parts = formatEventCardTitleParts(event)
  return parts.venue ? `${parts.title} · ${parts.venue}` : parts.title
}
