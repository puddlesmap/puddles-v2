export type EventStatus = 'Draft' | 'Published' | 'Hidden' | 'Expired' | 'Cancelled'

export type City =
  | 'Palo Alto'
  | 'Los Altos'
  | 'Mountain View'
  | 'Cupertino'
  | 'Redwood City'
  | 'Menlo Park'
  | 'Sunnyvale'
  | 'San Jose'
  | 'Fremont'
  | 'San Francisco'
  /** Seasonal / Worth a little drive destinations (not Browse city filters). */
  | 'Half Moon Bay'
  | 'Morgan Hill'
  | 'Hayward'
  | 'Felton'
  | 'Santa Clara'
  | 'Los Gatos'
  | 'Woodside'
export type CostLabel = 'Free' | 'Low-cost' | 'Paid' | (string & {})

/** True when the activity is free to attend (not a dollar amount / paid tag). */
export function isFreeCost(cost: string | undefined | null): boolean {
  const value = String(cost ?? '')
    .trim()
    .toLowerCase()
  return !value || value === 'free' || value === '$0' || value === '0'
}
export type ActivityType =
  | 'Stories'
  | 'Music & Movement'
  | 'Arts & Crafts'
  | 'Build & Explore'
  | 'Outdoor'
  | 'Social & Play'
  | 'Classes'
  | 'Festivals & Community'
  | 'Parent & Me'
  | 'Other'

export const ACTIVITY_TYPES: ActivityType[] = [
  'Stories',
  'Music & Movement',
  'Arts & Crafts',
  'Build & Explore',
  'Outdoor',
  'Social & Play',
  'Classes',
  'Festivals & Community',
  'Parent & Me',
  'Other',
]

export interface Event {
  id: string
  title: string
  description: string
  /** Optional parent tips from the Events sheet Tips column. */
  tips?: string
  venue: string
  /** Specific room or area within the venue (sheet column E). */
  room?: string
  address: string
  city: City
  date: string
  startTime: string
  endTime: string
  /**
   * Long-running destinations (pumpkin farms, holiday displays).
   * When set to `seasonal-run`, card/detail use Opens / Open TODAY labels instead of a single-day date.
   * `multi-day` = short festival weekends (e.g. Labor Day Fri–Sun, Moon Festival Sat–Sun).
   */
  scheduleKind?: 'one-time' | 'seasonal-run' | 'multi-day'
  /** Season opening day (YYYY-MM-DD). Defaults to `date` when scheduleKind is seasonal-run. */
  openingDate?: string
  /** Official closing day only — never invent. */
  closingDate?: string
  /** e.g. Daily, Fri–Sun, Weekends — shown on event WHEN as recurrence · hours */
  recurringDaysLabel?: string
  /**
   * Smaller italic caveat under the schedule line on event WHEN
   * (e.g. “Also open weekdays in September & October”). Omit from browse cards / rail.
   */
  scheduleNote?: string
  /**
   * Multi-day festival window label for WHEN (e.g. “During Labor Day weekend”).
   * Shown as “{label} · Sep 5–7” under hours — not in Good to know.
   */
  scheduleWindowLabel?: string
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
export type { AgeFilter } from '../utils/ageRange'
