import type { City } from '../types/event'
import { ALL_SHEET_EVENTS } from './events'

export type ShareCity = City | 'Other'

export const SHARE_CITY_OPTIONS: { value: ShareCity; label: string }[] = [
  { value: 'Palo Alto', label: 'Palo Alto' },
  { value: 'Los Altos', label: 'Los Altos' },
  { value: 'Mountain View', label: 'Mountain View' },
  { value: 'Other', label: 'Other / Not sure' },
]

export interface ShareVenue {
  id: string
  name: string
  address: string
  city: City
}

const CURATED_VENUES: ShareVenue[] = [
  {
    id: 'downtown-library',
    name: 'Downtown Library',
    address: '270 Forest Ave, Palo Alto, CA 94301',
    city: 'Palo Alto',
  },
  {
    id: 'college-terrace-library',
    name: 'College Terrace Library',
    address: '2300 Wellesley St, Palo Alto, CA 94306',
    city: 'Palo Alto',
  },
  {
    id: 'mitchell-park-library',
    name: 'Mitchell Park Library',
    address: '3700 Middlefield Rd, Palo Alto, CA 94303',
    city: 'Palo Alto',
  },
  {
    id: 'childrens-library',
    name: "Children's Library",
    address: '1276 Harriet St, Palo Alto, CA 94301',
    city: 'Palo Alto',
  },
  {
    id: 'rinconada-library',
    name: 'Rinconada Library',
    address: '1213 Newell Rd, Palo Alto, CA 94303',
    city: 'Palo Alto',
  },
  {
    id: 'los-altos-library',
    name: 'Los Altos Library',
    address: '13 S San Antonio Rd, Los Altos, CA 94022',
    city: 'Los Altos',
  },
  {
    id: 'mountain-view-library',
    name: 'Mountain View Library',
    address: '585 Franklin St, Mountain View, CA 94041',
    city: 'Mountain View',
  },
  {
    id: 'pioneer-park',
    name: 'Pioneer Park',
    address: '375 Church St, Mountain View, CA 94041',
    city: 'Mountain View',
  },
  {
    id: 'deer-hollow-farm',
    name: 'Deer Hollow Farm',
    address: '22500 Cristo Rey Dr, Los Altos, CA 94022',
    city: 'Mountain View',
  },
  {
    id: 'magical-bridge',
    name: 'Magical Bridge Playground',
    address: '2700 Mitchell Park Dr, Palo Alto, CA 94306',
    city: 'Palo Alto',
  },
]

function venueId(name: string, city: City): string {
  return `${city}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function mergeVenues(existing: ShareVenue[], candidate: ShareVenue): ShareVenue[] {
  if (existing.some((venue) => venue.id === candidate.id)) return existing
  return [...existing, candidate]
}

/** Known venues for the Share form — curated list plus venues from live Events data. */
export function getAllShareVenues(): ShareVenue[] {
  let venues = [...CURATED_VENUES]

  for (const event of ALL_SHEET_EVENTS) {
    if (!event.venue?.trim()) continue
    venues = mergeVenues(venues, {
      id: venueId(event.venue, event.city),
      name: event.venue,
      address: event.address || event.venue,
      city: event.city,
    })
  }

  return venues.sort((a, b) => a.name.localeCompare(b.name))
}

export function getShareVenuesForCity(city: City): ShareVenue[] {
  return getAllShareVenues().filter((venue) => venue.city === city)
}

export function findShareVenueById(id: string): ShareVenue | undefined {
  return getAllShareVenues().find((venue) => venue.id === id)
}
