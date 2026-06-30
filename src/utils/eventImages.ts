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

export function isMissingEventImage(url: string | undefined | null): boolean {
  const trimmed = String(url ?? '').trim()
  if (!trimmed || trimmed === '#') return true
  if (trimmed === LEGACY_PLACEHOLDER_URL) return true
  return false
}

export function getEventPrimaryType(event: Event): ActivityType {
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
