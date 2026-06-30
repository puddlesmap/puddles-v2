import type { Event } from '../types/event'

export interface EventLocationGroup {
  key: string
  lat: number
  lng: number
  events: Event[]
  label: string
}

export function getEventLocationKey(event: Event): string {
  return `${event.lat.toFixed(5)},${event.lng.toFixed(5)}`
}

export function getLocationDisplayName(events: Event[]): string {
  const first = events[0]
  if (!first) return 'this location'

  const room = first.room?.trim()
  if (room) return room

  const venue = first.venue?.trim()
  if (venue) return venue

  return first.city
}

export function groupMappableEventsByLocation(events: Event[]): EventLocationGroup[] {
  const groups = new Map<string, Event[]>()

  for (const event of events) {
    const key = getEventLocationKey(event)
    const list = groups.get(key) ?? []
    list.push(event)
    groups.set(key, list)
  }

  return [...groups.entries()].map(([key, groupEvents]) => {
    const sorted = [...groupEvents].sort(
      (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    )

    return {
      key,
      lat: sorted[0].lat,
      lng: sorted[0].lng,
      events: sorted,
      label: getLocationDisplayName(sorted),
    }
  })
}

export function getLocationGroupLabel(group: EventLocationGroup): string | null {
  if (group.events.length <= 1) return null
  return `${group.events.length} events at ${group.label}`
}

export function findLocationGroupForEvent(
  groups: EventLocationGroup[],
  event: Event | null,
): EventLocationGroup | null {
  if (!event) return null
  const key = getEventLocationKey(event)
  return groups.find((group) => group.key === key) ?? null
}
