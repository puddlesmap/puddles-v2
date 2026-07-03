import type { ActivityType, Event } from '../types/event'
import { ACTIVITY_TYPES } from '../types/event'

export const LEGACY_PLACEHOLDER_URL =
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=500&fit=crop'

export const EVENT_FALLBACK_IMAGES: Record<ActivityType, string> = {
  Stories: '/event-fallbacks/stories.png',
  'Music & Movement': '/event-fallbacks/music.png',
  'Build & Explore': '/event-fallbacks/build.png',
  'Arts & Crafts': '/event-fallbacks/arts.png',
  Outdoor: '/event-fallbacks/outdoor.png',
  'Social & Play': '/event-fallbacks/play.png',
  Classes: '/event-fallbacks/classes.png',
  Other: '/event-fallbacks/other.png',
}

const ACTIVITY_TYPE_SET = new Set<string>(ACTIVITY_TYPES)

function normalizeActivityType(value: string): ActivityType | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (ACTIVITY_TYPE_SET.has(trimmed)) return trimmed as ActivityType
  return null
}

/** Infer a better activity type from free text when sheet tags are missing or only "Other". */
export function inferActivityTypesFromText(...parts: string[]): ActivityType[] {
  const lower = parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!lower) return []

  const matched: ActivityType[] = []
  if (lower.includes('story')) matched.push('Stories')
  if (
    lower.includes('music') ||
    lower.includes('movement') ||
    lower.includes('concert') ||
    lower.includes('song')
  ) {
    matched.push('Music & Movement')
  }
  if (lower.includes('art') || lower.includes('craft')) matched.push('Arts & Crafts')
  if (lower.includes('outdoor') || lower.includes('park')) matched.push('Outdoor')
  if (lower.includes('lego') || lower.includes('steam') || lower.includes('build')) {
    matched.push('Build & Explore')
  }
  if (lower.includes('play') || lower.includes('social')) matched.push('Social & Play')
  if (lower.includes('class')) matched.push('Classes')

  return matched
}

export function isMissingEventImage(url: string | undefined | null): boolean {
  const trimmed = String(url ?? '').trim()
  if (!trimmed || trimmed === '#') return true
  if (trimmed === LEGACY_PLACEHOLDER_URL) return true
  return false
}

function firstKnownActivityType(values: string[]): ActivityType | null {
  for (const value of values) {
    const normalized = normalizeActivityType(value)
    if (normalized && normalized !== 'Other') return normalized
  }
  return null
}

export function getEventPrimaryType(event: Event): ActivityType {
  const fromTags =
    firstKnownActivityType(event.types) ?? firstKnownActivityType(event.categoryTags)
  if (fromTags) return fromTags

  const inferred = inferActivityTypesFromText(
    event.title,
    event.description,
    ...event.types,
    ...event.categoryTags,
  )
  if (inferred.length > 0) return inferred[0]

  for (const type of event.types) {
    const normalized = normalizeActivityType(type)
    if (normalized) return normalized
  }

  for (const tag of event.categoryTags) {
    const normalized = normalizeActivityType(tag)
    if (normalized) return normalized
  }

  return 'Other'
}

/** Parent-facing category label for cards and detail metadata. */
export function getEventDisplayCategory(event: Event): ActivityType | null {
  const type = getEventPrimaryType(event)
  return type === 'Other' ? null : type
}

/** Category tags for detail metadata — skips bare "Other" and infers from title when needed. */
export function getEventCategoryTags(event: Event): string[] {
  const raw = event.categoryTags.length > 0 ? event.categoryTags : event.types
  const filtered = raw.filter((tag) => tag !== 'Other')
  if (filtered.length > 0) return filtered

  const inferred = getEventDisplayCategory(event)
  return inferred ? [inferred] : []
}

export function getEventFallbackImageUrl(event: Event): string {
  return EVENT_FALLBACK_IMAGES[getEventPrimaryType(event)]
}

export function getEventImageUrl(event: Event): string {
  if (!isMissingEventImage(event.imageUrl)) return event.imageUrl.trim()
  return getEventFallbackImageUrl(event)
}

export function isEventFallbackImage(url: string, event: Event): boolean {
  return url === getEventFallbackImageUrl(event)
}

export function getEventImageKey(event: Event): string {
  return `${event.id}:${getEventImageUrl(event)}`
}
