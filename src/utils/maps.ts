import type { Event } from '../types/event'

export function getEventDirectionsDestination(event: Event): string | null {
  const address = event.address?.trim()
  const venue = event.venue?.trim()
  const city = event.city?.trim()

  if (address) {
    return venue ? `${venue}, ${address}` : address
  }

  if (venue && city) {
    return `${venue}, ${city}`
  }

  if (venue) {
    return venue
  }

  if (city) {
    return city
  }

  if (Number.isFinite(event.lat) && Number.isFinite(event.lng)) {
    return `${event.lat},${event.lng}`
  }

  return null
}

export function getEventDirectionsUrl(event: Event): string | null {
  const destination = getEventDirectionsDestination(event)
  if (!destination) return null

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

export function getEventDirectionsLabel(event: Event): string {
  const name = event.venue?.trim() || event.address?.trim() || 'this event'
  return `Open directions to ${name}`
}

export function getEventAddressLine(event: Event): string {
  const address = event.address?.trim()
  if (address) return address

  const city = event.city?.trim()
  if (city) return city

  return ''
}
