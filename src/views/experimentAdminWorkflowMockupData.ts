/** Inbox / Sources fixtures stay hand-picked. Events catalog maps from live Puddles / Admin. */

import {
  ALL_LAUNCH_REVIEW_DISCOVERY_EVENTS,
  ALL_SEASONAL_DRIVE_EVENTS,
  ALL_EVENTS,
} from '../data/events'
import { ALL_DISCOVERY_CANDIDATES, isDiscoveryCandidateExpired } from '../data/discovery'
import { getSeasonalCollection } from '../data/seasonalDiscovery'
import type { DiscoveryCandidate } from '../types/discovery'
import { ACTIVITY_TYPES, type Event } from '../types/event'
import { collectAdminReviewFlags } from '../utils/adminReviewFlags'
import { reviewFlagsForCatalog } from '../utils/adminSeasonalEvents'
import { syncReadyDiscoveryIntoAdminCache } from '../utils/discoveryApproveLocal'
import {
  applyDiscoveryReviewOverrides,
  loadDiscoveryReviewStore,
} from '../utils/discoveryReview'
import { getEventLifecycleStatus } from '../utils/eventLifecycle'
import { formatSeasonalBrowseWhen } from '../utils/formatSeasonalSchedule'
import { enrichPublishingFields } from '../utils/publishing'

export const CORE_CITIES = ['Palo Alto', 'Mountain View', 'Los Altos', 'Sunnyvale'] as const

export type MockGeo = 'core' | 'out'
export type MockReviewStatus = 'new' | 'draft' | 'published' | 'watch' | 'skip'
export type MockEventStatus = 'Draft' | 'Published'
export type MockCollectionId =
  | 'hello-fall'
  | 'halloween'
  | 'holiday'
  | 'lunar-new-year'
  | 'spring'
  | 'summer'
  | 'harvest-farms'
export type MockCollectionBand = 'current' | 'upcoming'
export type MockFlag =
  | 'official-source'
  | 'age-unclear'
  | 'registration-unclear'
  | 'price-unclear'
  | 'date-needs-verification'
  | 'seasonal-details-incomplete'

export interface MockMatch {
  title: string
  status: string
  placement: string
}

export interface MockCandidate {
  id: string
  title: string
  dateLabel: string
  dateSort: string
  city: string
  venue: string
  type: string
  source: 'Library' | 'Weekend search' | 'Regional' | 'Share' | 'Watchlist'
  officialUrl: string
  sourceType: string
  lastChecked: string
  ageGuidance: string
  cost: string
  registration: string
  goodToKnow: string
  note: string
  flags: MockFlag[]
  match?: MockMatch
  watchReason?: string
  missing?: string
  recheckDate?: string
  recheckDue?: boolean
  registrationOpens?: string
}

export interface MockCatalogEvent {
  id: string
  title: string
  dateLabel: string
  dateSort: string
  city: string
  venue: string
  type: string
  status: MockEventStatus
  ageGuidance: string
  cost: string
  goodToKnow: string
  collections: MockCollectionId[]
  attention?: string
  fromCandidateId?: string
  /** Schedule has ended relative to the mockup “as of” date. */
  isPast?: boolean
  description?: string
  address?: string
  room?: string
  startTime?: string
  endTime?: string
  eventUrl?: string
  imageUrl?: string
  lastChecked?: string
  /** Live row has saved edits that have not been Deployed. */
  pendingDeploy?: boolean
}

export interface MockCollectionDef {
  id: MockCollectionId
  name: string
  window: string
  windowFrom: string
  windowUntil: string
  band: MockCollectionBand
  active: boolean
}

export interface MockSuggestion {
  id: string
  name: string
  window: string
  reasoning: string
  eventIds: string[]
}

export interface MockProvider {
  id: string
  name: string
  city: string
  url: string
  programming: string
  lastChecked: string
  why: string
}

export const PLANNED_COLLECTIONS: MockCollectionDef[] = [
  {
    id: 'hello-fall',
    name: 'Hello Fall',
    window: 'Sep 1 – Oct 31, 2026',
    windowFrom: '2026-09-01',
    windowUntil: '2026-10-31',
    band: 'current',
    active: true,
  },
  {
    id: 'halloween',
    name: 'Halloween with little ones',
    window: 'Oct 5 – Oct 31, 2026 (overlaps Hello Fall)',
    windowFrom: '2026-10-05',
    windowUntil: '2026-10-31',
    band: 'upcoming',
    active: false,
  },
  {
    id: 'holiday',
    name: 'Holiday',
    window: 'Nov 24 – Dec 31, 2026 · fills as soon as a Nov/Dec outing is queued',
    windowFrom: '2026-11-24',
    windowUntil: '2026-12-31',
    band: 'upcoming',
    active: false,
  },
  {
    id: 'lunar-new-year',
    name: 'Lunar New Year',
    window: 'Jan 15 – Feb 16, 2027',
    windowFrom: '2027-01-15',
    windowUntil: '2027-02-16',
    band: 'upcoming',
    active: false,
  },
  {
    id: 'spring',
    name: 'Spring',
    window: 'Mar 1 – May 31, 2027',
    windowFrom: '2027-03-01',
    windowUntil: '2027-05-31',
    band: 'upcoming',
    active: false,
  },
  {
    id: 'summer',
    name: 'Summer',
    window: 'Jun 1 – Aug 31, 2027',
    windowFrom: '2027-06-01',
    windowUntil: '2027-08-31',
    band: 'upcoming',
    active: false,
  },
]

export const HARVEST_FARMS_COLLECTION: MockCollectionDef = {
  id: 'harvest-farms',
  name: 'Harvest farms',
  window: 'Sep 17 – Oct 31, 2026',
  windowFrom: '2026-09-17',
  windowUntil: '2026-10-31',
  band: 'upcoming',
  active: false,
}

/** Upcoming themes that live Events may join by date (Hello Fall / Halloween already come from live IDs). */
const LIVE_DATE_FIT_COLLECTIONS: MockCollectionId[] = [
  'holiday',
  'lunar-new-year',
  'spring',
  'summer',
]

const HOLIDAY_COPY =
  /\b(lights?|santa|tree lighting|holiday|christmas|hanukkah|kwanzaa|menorah|barn lighting)\b/i

function dayKey(value: string): string {
  return (value || '').slice(0, 10)
}

function isTbaDate(dateSort: string): boolean {
  const day = dayKey(dateSort)
  return !day || day.startsWith('9999')
}

/** Ingest auto-tag: date window (and holiday copy in early November). Harvest farms is Approve-only. */
export function fitCollectionsForEvent(
  dateSort: string,
  title = '',
  extraText = '',
): MockCollectionId[] {
  if (isTbaDate(dateSort)) return []
  const day = dayKey(dateSort)
  const ids: MockCollectionId[] = []
  if (day >= '2026-09-01' && day <= '2026-10-31') ids.push('hello-fall')
  if (day >= '2026-10-05' && day <= '2026-10-31') ids.push('halloween')
  const holidayCopy = HOLIDAY_COPY.test(`${title} ${extraText}`)
  if (day >= '2026-11-18' && day <= '2026-12-31') ids.push('holiday')
  else if (day >= '2026-11-01' && day <= '2026-11-17' && holidayCopy) ids.push('holiday')
  if (day >= '2027-01-15' && day <= '2027-02-16') ids.push('lunar-new-year')
  if (day >= '2027-03-01' && day <= '2027-05-31') ids.push('spring')
  if (day >= '2027-06-01' && day <= '2027-08-31') ids.push('summer')
  return ids
}

export function fitCollectionsForCandidate(candidate: MockCandidate): MockCollectionId[] {
  return fitCollectionsForEvent(
    candidate.dateSort,
    candidate.title,
    `${candidate.note} ${candidate.goodToKnow} ${candidate.dateLabel}`,
  )
}

export const INITIAL_SUGGESTIONS: MockSuggestion[] = [
  {
    id: 'sug-harvest',
    name: 'Harvest farms',
    window: 'Sep 17 – Oct 31',
    reasoning:
      'Hello Fall already has Spina, Patchen, and Applefest as Worth a little drive on the live site. Filoli Harvest Days has official Oct 10–11 dates but no collection, so it sits Unplaced — parents cannot see it. A Harvest farms collection is optional; assigning Hello Fall is enough.',
    eventIds: ['evt-spina-live', 'evt-patchen', 'evt-applefest', 'evt-filoli-harvest'],
  },
  {
    id: 'sug-rainy',
    name: 'Rainy-day indoor',
    window: 'Anytime',
    reasoning:
      'Only one indoor tot program showed up in this pass (Music Together), and it is already in Browse as a year-round series. That is not a seasonal pattern — too thin for a collection.',
    eventIds: ['evt-music-together'],
  },
]

export const INITIAL_CANDIDATES: MockCandidate[] = [
  {
    id: 'cand-hidden-villa',
    title: 'Hidden Villa weekend farm tours',
    dateLabel: 'Dates TBA',
    dateSort: '9999-12-31',
    city: 'Los Altos Hills',
    venue: 'Hidden Villa',
    type: 'Outdoor',
    source: 'Watchlist',
    officialUrl: 'https://www.hiddenvilla.org/programs/individuals-families/',
    sourceType: 'Official program page',
    lastChecked: 'Sep 1',
    ageGuidance: '',
    cost: '',
    registration: 'Not posted',
    goodToKnow: '',
    note: 'Usually a strong tot outing. Weekend tour calendar not posted yet — Watch, not Unplaced.',
    flags: ['date-needs-verification', 'age-unclear', 'registration-unclear'],
    watchReason: 'Dates not announced yet',
    missing: 'Tour dates, ages, cost',
    recheckDate: 'Sep 14',
    recheckDue: true,
  },
  {
    id: 'cand-gamble-pumpkins',
    title: 'Pumpkin decorating morning',
    dateLabel: 'Sat, Oct 11 · 10:00 AM',
    dateSort: '2026-10-11',
    city: 'Palo Alto',
    venue: 'Elizabeth F. Gamble Garden',
    type: 'Arts & Crafts',
    source: 'Weekend search',
    officialUrl: 'https://www.gamblegarden.org/events/category/kids/',
    sourceType: 'Official kids calendar',
    lastChecked: 'Sep 12',
    ageGuidance: 'Families with young children',
    cost: 'Free',
    registration: 'Drop-in',
    goodToKnow: 'Outdoor · weather permitting.',
    note: 'Local + seasonal. Fits Hello Fall; still belongs in Browse.',
    flags: ['official-source'],
  },
  {
    id: 'cand-talo-yoga',
    title: 'Baby & Me yoga',
    dateLabel: 'Wed · 10:00 AM (series)',
    dateSort: '2026-09-16',
    city: 'Mountain View',
    venue: 'Talo Yoga',
    type: 'Parent & Me',
    source: 'Watchlist',
    officialUrl: 'https://www.taloyoga.com/',
    sourceType: 'Official studio page',
    lastChecked: 'Sep 10',
    ageGuidance: 'Babies with a caregiver',
    cost: 'Paid · trial class available',
    registration: 'Registration required',
    goodToKnow: 'Caregiver participation required. Some sections may fill — check the studio page.',
    note: 'Year-round class. Browse only — not a seasonal pick.',
    flags: ['official-source'],
  },
  {
    id: 'cand-storytime-dup',
    title: 'Baby Storytime',
    dateLabel: 'Fri, Sep 19 · 10:30 AM',
    dateSort: '2026-09-19',
    city: 'Palo Alto',
    venue: "Children's Library",
    type: 'Stories',
    source: 'Library',
    officialUrl: 'https://paloalto.bibliocommons.com/',
    sourceType: 'Library calendar',
    lastChecked: 'Sep 14',
    ageGuidance: 'Babies',
    cost: 'Free',
    registration: 'No registration needed',
    goodToKnow: 'Caregiver stays with child.',
    note: 'Already live. Do not create a second row for Hello Fall.',
    flags: ['official-source'],
    match: {
      title: 'Baby Storytime',
      status: 'Published',
      placement: 'Browse · not in a seasonal collection',
    },
  },
  {
    id: 'cand-share-craft',
    title: 'Saturday craft morning',
    dateLabel: 'Sat, Sep 20 · 10:00 AM',
    dateSort: '2026-09-20',
    city: 'Los Altos',
    venue: 'Los Altos Youth Center',
    type: 'Arts & Crafts',
    source: 'Share',
    officialUrl: 'https://www.losaltosca.gov/',
    sourceType: 'Parent Share · confirm on city page',
    lastChecked: 'Sep 13',
    ageGuidance: '',
    cost: 'Free',
    registration: 'Unclear',
    goodToKnow: '',
    note: 'Share form lead. Age and RSVP not on the linked page.',
    flags: ['age-unclear', 'registration-unclear'],
  },
  {
    id: 'cand-food-fest',
    title: 'OMG Food Festival',
    dateLabel: 'Sat–Sun, Sep 28–29',
    dateSort: '2026-09-28',
    city: 'Sunnyvale',
    venue: 'Downtown Sunnyvale',
    type: 'Festivals & Community',
    source: 'Weekend search',
    officialUrl: 'https://downtownsunnyvale.org/',
    sourceType: 'Downtown association',
    lastChecked: 'Sep 12',
    ageGuidance: 'All ages',
    cost: 'Paid',
    registration: 'Tickets',
    goodToKnow: '',
    note: 'Food-forward. No Kids Zone or tot activity on the source. Likely Skip.',
    flags: ['official-source', 'seasonal-details-incomplete'],
  },
  {
    id: 'cand-bunnyhive',
    title: 'Bunnyhive fall session',
    dateLabel: 'Fall dates TBD',
    dateSort: '9999-12-30',
    city: 'Sunnyvale',
    venue: 'Bunnyhive',
    type: 'Parent & Me',
    source: 'Watchlist',
    officialUrl: 'https://www.bunnyhive.com/',
    sourceType: 'Official studio page',
    lastChecked: 'Sep 8',
    ageGuidance: '',
    cost: '',
    registration: 'Registration not open yet',
    goodToKnow: '',
    note: 'Promising local series. Wait for the fall calendar.',
    flags: ['registration-unclear', 'date-needs-verification', 'age-unclear'],
    watchReason: 'Registration opens later',
    missing: 'Session dates, ages, pricing',
    recheckDate: 'Sep 22',
    recheckDue: false,
    registrationOpens: 'Around Sep 22 (studio usually posts then)',
  },
  {
    id: 'cand-magical-bridge-mv',
    title: 'Magical Bridge Performance Series',
    dateLabel: 'Sep 5, 19, 24 & Oct 1, 9, 15 · 4:00–5:00 PM',
    dateSort: '2026-09-19',
    city: 'Mountain View',
    venue: 'Magical Bridge Playground at Rengstorff Park',
    type: 'Music & Movement',
    source: 'Watchlist',
    officialUrl:
      'https://www.magicalbridge.org/event-details-registration/magical-bridge-performance-series-at-rengstorff-park-2',
    sourceType: 'Official Magical Bridge + City of Mountain View',
    lastChecked: 'Sep 14',
    ageGuidance: 'All ages · Little ones welcome',
    cost: 'Free',
    registration: 'Drop-in',
    goodToKnow: 'Magic, music, and puppetry on the playground stage. Performers may change.',
    note: 'One series row — not six weekly listings. Official hours are 4:00–5:00 PM, not 5:30. Published dates are Sep 5, 19, 24 and Oct 1, 9, 15 — not Wed 9/16, 9/30, 10/14. Core city → Browse after Go live. Bookmobile storytimes at 10 AM are already on the site; do not mix them into this row.',
    flags: ['official-source'],
  },
  {
    id: 'cand-filoli-lights',
    title: 'Holiday lights at Filoli',
    dateLabel: 'Sat, Dec 5 · 5:00 PM',
    dateSort: '2026-12-05',
    city: 'Woodside',
    venue: 'Filoli Historic House & Garden',
    type: 'Festivals & Community',
    source: 'Weekend search',
    officialUrl: 'https://filoli.org/',
    sourceType: 'Official calendar',
    lastChecked: 'Sep 14',
    ageGuidance: 'All ages · Little ones welcome',
    cost: 'Paid',
    registration: 'Tickets',
    goodToKnow: 'Evening lights on the official holiday calendar.',
    note: 'December date auto-tags Holiday on ingest. Out of area — Add keeps Holiday, not Unplaced. Uncheck if wrong.',
    flags: ['official-source'],
  },
]

export const INITIAL_EVENTS: MockCatalogEvent[] = [
  {
    id: 'evt-harvest',
    title: 'Harvest History Festival',
    dateLabel: 'Sat, Sep 26 · 9:00 AM',
    dateSort: '2026-09-26',
    city: 'Mountain View',
    venue: 'Heritage Park',
    type: 'Festivals & Community',
    status: 'Published',
    ageGuidance: 'All ages · Little ones welcome',
    cost: 'Free',
    goodToKnow: 'Family activities and a peek inside the historic Immigrant House.',
    collections: ['hello-fall'],
  },
  {
    id: 'evt-midautumn',
    title: 'Sunnyvale Mid-Autumn Festival',
    dateLabel: 'Sat–Sun, Oct 3–4 · 10:00 AM',
    dateSort: '2026-10-03',
    city: 'Sunnyvale',
    venue: 'Cityline Sunnyvale',
    type: 'Festivals & Community',
    status: 'Published',
    ageGuidance: 'All ages · Little ones welcome',
    cost: 'Free',
    goodToKnow: 'Free admission; food and crafts are pay-as-you-go.',
    collections: ['hello-fall'],
  },
  {
    id: 'evt-music-together',
    title: 'Music Together · Fall semester',
    dateLabel: 'Sep 9–Nov 18 · Mon / Wed / Fri options',
    dateSort: '2026-09-09',
    city: 'Palo Alto',
    venue: 'Community Music Center',
    type: 'Parent & Me',
    status: 'Published',
    ageGuidance: 'Babies through preschoolers',
    cost: 'Paid',
    goodToKnow: 'Registration required · semester package, not drop-in. Caregiver participates.',
    collections: [],
  },
  {
    id: 'evt-spina-live',
    title: 'Spina Farms Pumpkin Patch',
    dateLabel: 'Opens Sep 17 · through Nov 2',
    dateSort: '2026-09-17',
    city: 'Morgan Hill',
    venue: 'Spina Farms',
    type: 'Outdoor',
    status: 'Published',
    ageGuidance: 'All ages · Little ones welcome',
    cost: 'Free admission · attractions extra',
    goodToKnow: 'Hours vary — check the farm calendar.',
    collections: ['hello-fall'],
  },
  {
    id: 'evt-costume',
    title: 'Halloween Costume Game Night',
    dateLabel: 'Fri, Oct 17 · 6:00 PM',
    dateSort: '2026-10-17',
    city: 'Los Altos',
    venue: 'Town Hall Council Chambers',
    type: 'Social & Play',
    status: 'Published',
    ageGuidance: 'Little ones welcome',
    cost: 'Free',
    goodToKnow: 'Drop-in. Costumes optional.',
    collections: ['halloween'],
  },
  {
    id: 'evt-deer-hollow',
    title: 'Spooky Times at Deer Holloween Farm',
    dateLabel: 'Sat, Oct 17 · 10:00 AM',
    dateSort: '2026-10-17',
    city: 'Cupertino',
    venue: 'Deer Hollow Farm',
    type: 'Festivals & Community',
    status: 'Published',
    ageGuidance: '',
    cost: 'Paid',
    goodToKnow: 'Parking is about a one-mile walk to the farm. Limited seating.',
    collections: ['halloween'],
    attention: 'Address is Cupertino — out of area. Worth a little drive only, never Browse.',
  },
  {
    id: 'evt-storytime',
    title: 'Baby Storytime',
    dateLabel: 'Fri · 10:30 AM (weekly)',
    dateSort: '2026-09-19',
    city: 'Palo Alto',
    venue: "Children's Library",
    type: 'Stories',
    status: 'Published',
    ageGuidance: 'Babies',
    cost: 'Free',
    goodToKnow: 'No registration needed. Caregiver stays with child.',
    collections: [],
  },
  {
    id: 'evt-patchen',
    title: 'Patchen Pumpkin Patch',
    dateLabel: 'Opens Sep 18 · 10:00 AM–6:00 PM',
    dateSort: '2026-09-18',
    city: 'Los Gatos',
    venue: 'Patchen Christmas Tree & Pumpkin Farm',
    type: 'Outdoor',
    status: 'Published',
    ageGuidance: 'All ages · Little ones welcome',
    cost: 'Paid',
    goodToKnow: '$20 parking includes a mini pumpkin with purchase. Skip Harvest Nights wine set.',
    collections: ['hello-fall'],
  },
  {
    id: 'evt-applefest',
    title: 'Applefest at Ravenswood',
    dateLabel: 'Sat, Sep 13 · 12:00 PM',
    dateSort: '2026-09-13',
    city: 'Livermore',
    venue: 'Ravenswood Historic Site',
    type: 'Festivals & Community',
    status: 'Published',
    ageGuidance: 'All ages · Little ones welcome',
    cost: 'Paid',
    goodToKnow: 'Cider, orchard activities, and farm animals on the official page.',
    collections: ['hello-fall'],
  },
  {
    id: 'evt-filoli-harvest',
    title: 'Filoli Harvest Days',
    dateLabel: 'Sat–Sun, Oct 10–11 · 10:00 AM',
    dateSort: '2026-10-10',
    city: 'Woodside',
    venue: 'Filoli Historic House & Garden',
    type: 'Outdoor',
    status: 'Draft',
    ageGuidance: '',
    cost: 'Paid',
    goodToKnow: 'Garden harvest weekend on the official calendar.',
    collections: [],
  },
]

export const INITIAL_WATCH_STATUS: Record<string, MockReviewStatus> = {
  'cand-hidden-villa': 'watch',
  'cand-bunnyhive': 'watch',
}

export const PROVIDERS: MockProvider[] = [
  {
    id: 'prov-little-gym',
    name: 'The Little Gym of Mountain View',
    city: 'Mountain View',
    url: 'https://www.thelittlegym.com/',
    programming: 'Parent & Me / toddler gym',
    lastChecked: 'Sep 8',
    why: 'Core-city classes; confirm ages 0–5 vs 3–6 before adding a series row.',
  },
  {
    id: 'prov-bunnyhive',
    name: 'Bunnyhive',
    city: 'Sunnyvale',
    url: 'https://www.bunnyhive.com/',
    programming: 'Parent & Me play',
    lastChecked: 'Sep 8',
    why: 'Fall calendar usually posts later. Linked Watch item above.',
  },
  {
    id: 'prov-mini-yoga',
    name: 'Mini Yoga Club',
    city: 'Palo Alto',
    url: 'https://www.miniyogaclub.com/',
    programming: 'Parent + baby yoga',
    lastChecked: 'Sep 10',
    why: 'Already on Calendar Watchlist; recheck when a new session opens.',
  },
]

export function isCoreCity(city: string): boolean {
  return (CORE_CITIES as readonly string[]).includes(city)
}

export function geoForCity(city: string): MockGeo {
  return isCoreCity(city) ? 'core' : 'out'
}

export function isUnplacedEvent(event: MockCatalogEvent): boolean {
  return !isCoreCity(event.city) && event.collections.length === 0
}

const MOCK_COLLECTION_BY_SLUG: Record<string, MockCollectionId> = {
  'hello-fall': 'hello-fall',
  'halloween-with-little-ones': 'halloween',
}

export function mockCollectionsForEventId(eventId: string): MockCollectionId[] {
  const collections: MockCollectionId[] = []
  for (const [slug, id] of Object.entries(MOCK_COLLECTION_BY_SLUG)) {
    const seasonal = getSeasonalCollection(slug)
    if (!seasonal) continue
    const inCloseToHome = seasonal.collectionEventIds.includes(eventId)
    const inDrive = Boolean(seasonal.driveEventIds?.includes(eventId))
    if (inCloseToHome || inDrive) collections.push(id)
  }
  return collections
}

function mockIsPast(event: Event, now: Date): boolean {
  const life = getEventLifecycleStatus(event, now)
  return life === 'ended' || life === 'archived' || life === 'cancelled'
}

function mockStatusForEvent(event: Event, collections: MockCollectionId[]): MockEventStatus {
  if (event.status === 'Published' || event.status === 'Expired' || event.status === 'Cancelled') {
    return 'Published'
  }
  if (event.status === 'Hidden' && collections.length > 0) return 'Published'
  return 'Draft'
}

export function eventToMockCatalogEvent(
  event: Event,
  now: Date,
  attention?: string,
): MockCatalogEvent {
  const fromLive = mockCollectionsForEventId(event.id)
  const haystack = `${event.title} ${event.description || ''} ${event.tips || ''}`
  const fromDate = fitCollectionsForEvent(
    event.openingDate || event.date,
    event.title,
    haystack,
  ).filter((id) => {
    if (!LIVE_DATE_FIT_COLLECTIONS.includes(id)) return false
    if (id === 'holiday') return HOLIDAY_COPY.test(haystack)
    return true
  })
  const collections = [...new Set([...fromLive, ...fromDate])]
  return {
    id: event.id,
    title: event.title,
    dateLabel: formatSeasonalBrowseWhen(event, now).line,
    dateSort: event.openingDate || event.date,
    city: event.city,
    venue: event.venue,
    type: event.types[0] || 'Other',
    status: mockStatusForEvent(event, collections),
    ageGuidance: event.ageRange || '',
    cost: String(event.cost || ''),
    goodToKnow: (event.tips || '').trim(),
    collections,
    attention: attention || undefined,
    isPast: mockIsPast(event, now),
    description: event.description,
    address: event.address,
    room: event.room,
    startTime: event.startTime,
    endTime: event.endTime,
    eventUrl: event.eventUrl,
    imageUrl: event.imageUrl,
    lastChecked: event.verifiedDate,
  }
}

function attentionByEventId(events: Event[]): Map<string, string> {
  const flags = collectAdminReviewFlags(events)
  const combined = [
    ...reviewFlagsForCatalog(flags, events, 'regular'),
    ...reviewFlagsForCatalog(flags, events, 'seasonal'),
  ]
  const notes = new Map<string, string[]>()
  for (const flag of combined) {
    for (const id of flag.eventIds) {
      const list = notes.get(id) ?? []
      if (!list.includes(flag.note)) list.push(flag.note)
      notes.set(id, list)
    }
  }
  return new Map([...notes.entries()].map(([id, list]) => [id, list.join(' ')]))
}

function sourceCatalogEvents(): Event[] {
  let source: Event[] = []
  try {
    source = syncReadyDiscoveryIntoAdminCache().events.map((event) => enrichPublishingFields(event))
  } catch {
    source = ALL_EVENTS.map((event) => enrichPublishingFields(event))
  }
  const byId = new Map(source.map((event) => [event.id, event]))
  for (const drive of ALL_SEASONAL_DRIVE_EVENTS) {
    if (!byId.has(drive.id)) byId.set(drive.id, enrichPublishingFields(drive))
  }
  const launchReviewIds = new Set(ALL_LAUNCH_REVIEW_DISCOVERY_EVENTS.map((event) => event.id))
  return [...byId.values()].filter((event) => !launchReviewIds.has(event.id))
}

/** Same catalog as `/admin/events`, plus seasonal drive rows parents can see on Hello Fall. */
export function loadLiveMockCatalogEvents(now: Date): MockCatalogEvent[] {
  const events = sourceCatalogEvents()
  const attention = attentionByEventId(events)
  const mapped = events.map((event) => eventToMockCatalogEvent(event, now, attention.get(event.id)))
  return mapped.length > 0 ? mapped : INITIAL_EVENTS
}

export function findLiveMockupEvent(eventId: string): Event | undefined {
  return sourceCatalogEvents().find((event) => event.id === eventId)
}

export function mockCandidateFromDiscovery(candidate: DiscoveryCandidate): MockCandidate {
  const sourceRaw = String(candidate.source || '')
  const source: MockCandidate['source'] = sourceRaw.startsWith('Regional')
    ? 'Regional'
    : /weekend|instagram|core/i.test(sourceRaw)
      ? 'Weekend search'
      : /share/i.test(sourceRaw)
        ? 'Share'
        : /watchlist/i.test(sourceRaw)
          ? 'Watchlist'
          : 'Library'
  return {
    id: candidate.id,
    title: candidate.title,
    dateLabel: candidate.date,
    dateSort: candidate.date,
    city: candidate.city,
    venue: candidate.venue,
    type: candidate.types[0] || 'Other',
    source,
    officialUrl: candidate.eventUrl,
    sourceType: sourceRaw || 'Library',
    lastChecked: candidate.lastChecked || '—',
    ageGuidance: candidate.ageRange,
    cost: candidate.cost,
    registration: '',
    goodToKnow: candidate.tips || candidate.description,
    note: '',
    flags: [],
  }
}

/** Pending Discovery queue for the live Dashboard inbox (not the hand-picked mockup fixtures). */
export function loadLiveInboxCandidates(): DiscoveryCandidate[] {
  return applyDiscoveryReviewOverrides(ALL_DISCOVERY_CANDIDATES, loadDiscoveryReviewStore()).filter(
    (candidate) =>
      candidate.reviewStatus === 'pending' &&
      !candidate.alreadyOnPuddles &&
      !isDiscoveryCandidateExpired(candidate),
  )
}

export function findLiveDiscoveryCandidate(candidateId: string): DiscoveryCandidate | undefined {
  return loadLiveInboxCandidates().find((candidate) => candidate.id === candidateId)
}

/** Merge mockup edits onto the Admin/live Event so Deploy does not drop lat/lng/types. */
export function eventForLivePublish(event: MockCatalogEvent): Event {
  const live = findLiveMockupEvent(event.id)
  const base = live ?? eventFromMockCatalog(event)
  return enrichPublishingFields({
    ...base,
    title: event.title,
    description: event.description || base.description,
    tips: event.goodToKnow || base.tips,
    venue: event.venue,
    room: event.room || base.room,
    address: event.address || base.address,
    city: event.city as Event['city'],
    date: event.dateSort || base.date,
    startTime: event.startTime || base.startTime,
    endTime: event.endTime || base.endTime,
    ageRange: event.ageGuidance || base.ageRange,
    cost: event.cost || base.cost,
    eventUrl: event.eventUrl || base.eventUrl,
    imageUrl: event.imageUrl || base.imageUrl,
    verifiedDate: event.lastChecked || base.verifiedDate,
    status: event.status,
  })
}

/** Inbox-added mock rows are not in the live catalog — enough fields for Admin Events detail. */
export function eventFromMockCatalog(event: MockCatalogEvent): Event {
  const type = ACTIVITY_TYPES.find((item) => item === event.type) ?? 'Other'
  return enrichPublishingFields({
    id: event.id,
    title: event.title,
    description: event.description || event.goodToKnow || event.title,
    tips: event.goodToKnow || undefined,
    venue: event.venue,
    room: event.room,
    address: event.address || '',
    city: event.city as Event['city'],
    date: event.dateSort,
    startTime: event.startTime || '10:00',
    endTime: event.endTime || '11:00',
    ageRange: event.ageGuidance || '',
    ageMin: 0,
    ageMax: 5,
    types: [type],
    categoryTags: [],
    cost: event.cost || 'Free',
    imageUrl: event.imageUrl || '',
    eventUrl: event.eventUrl || '#',
    verifiedDate: event.lastChecked || '',
    lat: 0,
    lng: 0,
    status: event.status,
  })
}

export const FLAG_LABELS: Record<MockFlag, { mark: string; label: string }> = {
  'official-source': { mark: '✓', label: 'Official source' },
  'age-unclear': { mark: '⚠', label: 'Age unclear' },
  'registration-unclear': { mark: '⚠', label: 'Registration unclear' },
  'price-unclear': { mark: '⚠', label: 'Price unclear' },
  'date-needs-verification': { mark: '⚠', label: 'Date needs verification' },
  'seasonal-details-incomplete': { mark: '⚠', label: 'Seasonal details incomplete' },
}
