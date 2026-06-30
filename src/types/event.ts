export type EventStatus = 'Draft' | 'Published' | 'Hidden' | 'Expired'

export type City = 'Palo Alto' | 'Los Altos' | 'Mountain View'
export type CostLabel = 'Free' | 'Low-cost' | 'Paid'
export type ActivityType =
  | 'Stories'
  | 'Music & Movement'
  | 'Arts & Crafts'
  | 'Build & Explore'
  | 'Outdoor'
  | 'Social & Play'
  | 'Classes'
  | 'Other'

export const ACTIVITY_TYPES: ActivityType[] = [
  'Stories',
  'Music & Movement',
  'Arts & Crafts',
  'Build & Explore',
  'Outdoor',
  'Social & Play',
  'Classes',
  'Other',
]

export interface Event {
  id: string
  title: string
  description: string
  venue: string
  /** Specific room or area within the venue (sheet column E). */
  room?: string
  address: string
  city: City
  date: string
  startTime: string
  endTime: string
  ageRange: string
  ageMin: number
  ageMax: number
  types: ActivityType[]
  /** Raw labels from the sheet "Category Tags" column. */
  categoryTags: string[]
  cost: CostLabel
  imageUrl: string
  eventUrl: string
  verifiedDate: string
  lat: number
  lng: number
  /** Editorial/admin decision — editable in admin dashboard. */
  status: EventStatus
  /** Computed: event date/time has passed. Read-only in admin. */
  isPast: boolean
  /** Computed: Status = Published AND Is Past = FALSE. Public website gate. Read-only in admin. */
  isLive: boolean
}

export type DayFilter = 'today' | 'tomorrow' | 'weekend' | 'anytime'
export type TimeFilter = 'any' | 'morning' | 'after-lunch' | 'late-afternoon' | 'evening'
export type AgeFilter = 'all' | '0-2' | '2-5' | '5+'
