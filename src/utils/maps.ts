import type { City, Event } from '../types/event'
import {
  getCityCenter,
  getVenueGeo,
  getVenueGeoForEvent,
  isPlaceholderMapCoordinates,
} from '../data/venueGeo'

export { isPlaceholderMapCoordinates } from '../data/venueGeo'

export function isDateLikeValue(value: string): boolean {
  if (!value) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
}

function getStreetAddress(event: Event): string {
  const address = event.address?.trim()
  if (!address || isDateLikeValue(address)) return ''

  const normalized = address.toLowerCase()
  const venue = event.venue?.trim().toLowerCase()
  const room = event.room?.trim().toLowerCase()
  if (venue && normalized === venue) return ''
  if (room && normalized === room) return ''

  return address
}

export function getEventRoomLine(event: Event): string {
  const room = event.room?.trim()
  if (!room || isDateLikeValue(room)) return ''

  const venue = event.venue?.trim()
  if (venue && room.toLowerCase() === venue.toLowerCase()) return ''

  return room
}

export function getEventDirectionsDestination(event: Event): string | null {
  const address = getStreetAddress(event)
  const venue = event.venue?.trim()
  const room = event.room?.trim()
  const city = event.city?.trim()

  if (room && getVenueGeo(venue ?? '', room)) {
    if (address) return `${room}, ${address}`
    if (city) return `${room}, ${city}`
    return room
  }

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
  const name = event.venue?.trim() || getStreetAddress(event) || 'this event'
  return `Open directions to ${name}`
}

export function getEventAddressLine(event: Event): string {
  const address = getStreetAddress(event)
  if (address) return address

  const city = event.city?.trim()
  if (city) return city

  return ''
}

export function isCityShownInAddress(address: string, city: string): boolean {
  if (!address.trim() || !city.trim()) return false
  return address.toLowerCase().includes(city.trim().toLowerCase())
}

function isTrustedEventCoordinates(event: Event): boolean {
  return (
    Number.isFinite(event.lat) &&
    Number.isFinite(event.lng) &&
    !isPlaceholderMapCoordinates(event.lat, event.lng)
  )
}

/** Map pin coordinates for browse maps and route preview cards. */
export function getEventMapCoordinates(event: Event): { lat: number; lng: number } | null {
  const venueGeo = getVenueGeoForEvent(event.venue, event.room ?? '', event.address ?? '')
  if (venueGeo) {
    return { lat: venueGeo.lat, lng: venueGeo.lng }
  }

  if (isTrustedEventCoordinates(event)) {
    return { lat: event.lat, lng: event.lng }
  }

  const city = event.city?.trim() as City | undefined
  if (city === 'Palo Alto' || city === 'Los Altos' || city === 'Mountain View') {
    const center = getCityCenter(city)
    return { lat: center.lat, lng: center.lng }
  }

  return null
}

/** Prefer trusted venue/room coordinates over address geocoding for static maps. */
export function getEventMapMarkerAddress(event: Event): string | null {
  if (getVenueGeoForEvent(event.venue ?? '', event.room ?? '', event.address ?? '')) {
    return null
  }

  if (!getStreetAddress(event)) return null
  return getEventDirectionsDestination(event)
}
