export type DiscoveryReviewStatus = 'pending' | 'approved' | 'dismissed'

export interface DiscoveryCandidate {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  venue: string
  room: string
  address: string
  city: string
  lat: number | null
  lng: number | null
  ageRange: string
  ageMin: number | null
  ageMax: number | null
  audiences: string
  types: string[]
  categoryTags: string[]
  cost: string
  description: string
  tips: string
  imageUrl: string
  eventUrl: string
  source: string
  isCancelled: boolean
  isRecurring: boolean
  alreadyOnPuddles: boolean
  reviewStatus: DiscoveryReviewStatus
  convertedEventId: string
  lastChecked: string
}

export interface DiscoveryCatalog {
  generatedAt: string
  library: string
  window: { start: string; end: string; days: number }
  stats: Record<string, number>
  candidates: DiscoveryCandidate[]
}

/** Fields editable in Admin before approve. */
export type DiscoveryEditableFields = Pick<
  DiscoveryCandidate,
  | 'title'
  | 'description'
  | 'tips'
  | 'venue'
  | 'room'
  | 'address'
  | 'city'
  | 'date'
  | 'startTime'
  | 'endTime'
  | 'ageRange'
  | 'types'
  | 'cost'
  | 'eventUrl'
  | 'imageUrl'
  | 'lastChecked'
>

export type DiscoveryViewFilter = 'pending' | 'new' | 'already' | 'approved' | 'dismissed' | 'all'
