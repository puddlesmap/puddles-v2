import type { ActivityType, City, Event } from '../types/event'
import { SHEET_CSV_PROXY_PATH } from '../data/sheet-source'
import { enrichPublishingFields, resolvePublishingFields } from './publishing'
import { parseCsv, rowsToObjects } from './csv'

const ACTIVITY_TYPES: ActivityType[] = [
  'Stories',
  'Music & Movement',
  'Arts & Crafts',
  'Build & Explore',
  'Outdoor',
  'Social & Play',
  'Classes',
  'Other',
]

const VENUE_ALIASES: Record<string, string> = {
  'Mountain View Public Library': 'Mountain View Library',
  'Los Altos Public Library': 'Los Altos Library',
}

const VENUE_GEO: Record<string, { city: City; lat: number; lng: number }> = {
  'Downtown Library': { city: 'Palo Alto', lat: 37.4443, lng: -122.1598 },
  'College Terrace Library': { city: 'Palo Alto', lat: 37.4221, lng: -122.1381 },
  'Mitchell Park Library': { city: 'Palo Alto', lat: 37.4177, lng: -122.1288 },
  "Children's Library": { city: 'Palo Alto', lat: 37.4419, lng: -122.143 },
  'Rinconada Library': { city: 'Palo Alto', lat: 37.4281, lng: -122.1425 },
  'Mountain View Library': { city: 'Mountain View', lat: 37.3895, lng: -122.0818 },
  'Los Altos Library': { city: 'Los Altos', lat: 37.3791, lng: -122.1142 },
  'Pioneer Park': { city: 'Mountain View', lat: 37.3945, lng: -122.0786 },
  'Deer Hollow Farm': { city: 'Mountain View', lat: 37.319, lng: -122.085 },
}

const VENUE_ADDRESSES: Record<string, string> = {
  'Downtown Library': '270 Forest Ave, Palo Alto, CA 94301',
  'College Terrace Library': '2300 Wellesley St, Palo Alto, CA 94306',
  'Mitchell Park Library': '3700 Middlefield Rd, Palo Alto, CA 94303',
  "Children's Library": '1276 Harriet St, Palo Alto, CA 94301',
  'Rinconada Library': '1213 Newell Rd, Palo Alto, CA 94303',
  'Mountain View Library': '585 Franklin St, Mountain View, CA 94041',
  'Los Altos Library': '13 S San Antonio Rd, Los Altos, CA 94022',
  'Pioneer Park': '1146 Church St, Mountain View, CA 94041',
  'Deer Hollow Farm': '22500 Cristo Rey Dr, Los Altos, CA 94022',
}

function isDateLikeValue(value: string): boolean {
  if (!value) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
}

function canonicalVenue(venue: string): string {
  return VENUE_ALIASES[venue] ?? venue
}

function sanitizeAddress(venue: string, address: string): string {
  const trimmed = address.trim()
  if (trimmed && !isDateLikeValue(trimmed)) return trimmed
  const canonical = canonicalVenue(venue)
  return VENUE_ADDRESSES[canonical] ?? ''
}

function sanitizeRoom(room: string, venue: string): string {
  const trimmed = room.trim()
  if (!trimmed || isDateLikeValue(trimmed)) return ''
  if (venue && trimmed.toLowerCase() === venue.trim().toLowerCase()) return ''
  return trimmed
}

const COLUMN_ALIASES: Record<string, string[]> = {
  eventId: ['event id', 'softr record id'],
  title: ['title', 'titel', 'short title'],
  description: ['event description', 'description', 'event preview'],
  venue: ['venue', 'display location short', 'display location'],
  room: ['room'],
  address: ['address'],
  city: ['city'],
  date: ['event date', 'start date'],
  timeNormalized: ['time normalized'],
  startDateTime: ['start datetime'],
  endDateTime: ['end datetime'],
  ageRange: ['age tags clean', 'age tags', 'age simple'],
  categoryTags: ['category tags'],
  types: ['category tags', 'category clean', 'category tags final'],
  cost: ['cost'],
  imageUrl: ['image url'],
  eventUrl: ['event url'],
  approved: ['approved'],
  status: ['status'],
  verifiedDate: ['last checked date', 'last verified'],
  lng: ['longitude', 'longtitide', 'lng'],
  lat: ['latitude', 'lat'],
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function pickField(record: Record<string, string>, fieldKey: string): string {
  const aliases = COLUMN_ALIASES[fieldKey] ?? [fieldKey]
  for (const alias of aliases) {
    for (const [header, value] of Object.entries(record)) {
      const key = normalizeHeader(header)
      if (key === alias || key.includes(alias)) {
        return String(value ?? '').trim()
      }
    }
  }
  return ''
}

function parseCategoryTags(raw: string): string[] {
  const parts = raw
    .split(/[,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const tags: string[] = []
  for (const part of parts) {
    const key = part.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(part)
  }
  return tags
}

function parseSheetDate(value: string): string | null {
  const raw = value.trim()
  if (!raw) return null
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slash) {
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3]
    return `${year}-${slash[1].padStart(2, '0')}-${slash[2].padStart(2, '0')}`
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function clockTo24Hour(raw: string): string | null {
  const m = raw
    .trim()
    .toLowerCase()
    .match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (!m) return null
  let hour = parseInt(m[1], 10)
  const min = m[2] || '00'
  const ap = m[3]
  if (ap === 'pm' && hour < 12) hour += 12
  if (ap === 'am' && hour === 12) hour = 0
  return `${hour.toString().padStart(2, '0')}:${min}`
}

function parseTimeRange(value: string): { startTime: string; endTime: string } | null {
  const norm = value.replace(/\s+/g, ' ').trim().toLowerCase()
  if (!norm) return null
  const parts = norm.split(/\s*[-–—]{1,2}\s*|\s+to\s+/)
  const startTime = clockTo24Hour(parts[0])
  const endTime = clockTo24Hour(parts[1] || parts[0])
  if (!startTime || !endTime) return null
  return { startTime, endTime }
}

function parseSheetDateTime(value: string): { date: string; time: string } | null {
  const raw = value.trim()
  if (!raw) return null
  const m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return null
  let hour = parseInt(m[4], 10)
  const min = m[5]
  const ap = m[6]?.toUpperCase()
  if (ap === 'PM' && hour < 12) hour += 12
  if (ap === 'AM' && hour === 12) hour = 0
  const year = m[3].length === 2 ? `20${m[3]}` : m[3]
  return {
    date: `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`,
    time: `${hour.toString().padStart(2, '0')}:${min}`,
  }
}

function parseActivityTypes(raw: string): ActivityType[] {
  const parts = raw
    .split(/[,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)

  const matched: ActivityType[] = []
  for (const part of parts) {
    const found = ACTIVITY_TYPES.find((type) => type.toLowerCase() === part.toLowerCase())
    if (found && !matched.includes(found)) matched.push(found)
  }

  if (matched.length === 0) {
    const lower = raw.toLowerCase()
    if (lower.includes('story')) matched.push('Stories')
    if (lower.includes('music') || lower.includes('movement')) matched.push('Music & Movement')
    if (lower.includes('art') || lower.includes('craft')) matched.push('Arts & Crafts')
    if (lower.includes('outdoor') || lower.includes('park')) matched.push('Outdoor')
    if (lower.includes('lego') || lower.includes('steam') || lower.includes('build'))
      matched.push('Build & Explore')
    if (lower.includes('play') || lower.includes('social')) matched.push('Social & Play')
    if (lower.includes('class')) matched.push('Classes')
  }

  return matched.length > 0 ? matched : ['Other']
}

function parseAgeRange(raw: string) {
  const text = raw.trim()
  if (!text) return { min: 0, max: 5, label: '0–5' }

  const buckets = new Set<'0-2' | '2-5' | '5+'>()

  if (/all\s*ages?/i.test(text)) {
    return { min: 0, max: 5, label: text }
  }

  for (const part of text.split(/[,;]/)) {
    const normalized = part.trim().toLowerCase().replace(/\s+/g, '')
    if (normalized === '0-2' || normalized === '0–2') buckets.add('0-2')
    if (normalized === '2-5' || normalized === '2–5') buckets.add('2-5')
    if (normalized === '5+') buckets.add('5+')
  }

  if (buckets.size === 0) {
    const nums = [...text.matchAll(/(\d+)\s*[-–]\s*(\d+)/g)].map((match) => [
      parseInt(match[1], 10),
      parseInt(match[2], 10),
    ])
    if (nums.length === 0) {
      if (/^5\+$/i.test(text.trim().toLowerCase().replace(/\s+/g, ''))) {
        return { min: 5, max: 12, label: text }
      }
      return { min: 0, max: 5, label: text || '0–5' }
    }
    const min = Math.min(...nums.map(([a]) => a))
    const max = Math.max(...nums.map(([, b]) => b))
    if (min <= 2) buckets.add('0-2')
    if (min <= 5 && max >= 2) buckets.add('2-5')
    if (max > 5) buckets.add('5+')
  }

  const hasAll = buckets.has('0-2') && buckets.has('2-5') && buckets.has('5+')
  const min = buckets.has('0-2') ? 0 : buckets.has('2-5') ? 2 : 5
  const max =
    buckets.has('5+') && !buckets.has('0-2') && !buckets.has('2-5') ? 12 : 5

  return {
    min,
    max: hasAll ? 5 : max,
    label: text,
  }
}

function parseCost(raw: string): Event['cost'] {
  const value = raw.trim().toLowerCase()
  if (!value) return 'Free'
  if (value.includes('paid')) return 'Paid'
  if (value.includes('low')) return 'Low-cost'
  return 'Free'
}

function normalizeCity(raw: string): City {
  const value = raw.trim()
  if (value === 'Palo Alto' || value === 'Los Altos' || value === 'Mountain View') return value
  return 'Palo Alto'
}

function deriveEventId(record: Record<string, string>): string {
  const explicit = pickField(record, 'eventId')
  if (explicit) return explicit

  const eventUrl = pickField(record, 'eventUrl')
  if (eventUrl) {
    const slug = eventUrl.split('/').filter(Boolean).pop()
    if (slug) return slug
  }

  const title = pickField(record, 'title')
  const date = pickField(record, 'date')
  const venue = pickField(record, 'venue')
  return `${title}-${venue}-${date}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)
}

function resolveGeo(
  venue: string,
  address: string,
  city: string,
  latRaw: string,
  lngRaw: string,
  room = '',
) {
  const lat = parseFloat(latRaw)
  const lng = parseFloat(lngRaw)
  const canonical = canonicalVenue(venue)
  const roomGeo = room ? VENUE_GEO[room] : null
  const fallback = roomGeo ?? VENUE_GEO[canonical]
  let resolvedAddress = sanitizeAddress(venue, address)
  if (room && VENUE_ADDRESSES[room]) {
    resolvedAddress = VENUE_ADDRESSES[room]
  }
  const resolvedCity = normalizeCity(city || fallback?.city || '')

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { address: resolvedAddress, city: resolvedCity, lat, lng }
  }

  if (fallback) {
    return {
      address: resolvedAddress || VENUE_ADDRESSES[canonical] || venue,
      city: resolvedCity || fallback.city,
      lat: fallback.lat,
      lng: Number.isFinite(lng) ? lng : fallback.lng,
    }
  }

  return {
    address: resolvedAddress || venue,
    city: resolvedCity,
    lat: Number.isFinite(lat) ? lat : 37.44,
    lng: Number.isFinite(lng) ? lng : -122.14,
  }
}

function mapRecord(record: Record<string, string>): Event | null {
  const title = pickField(record, 'title')
  if (!title) return null

  const startDateTimeRaw = pickField(record, 'startDateTime')
  const endDateTimeRaw = pickField(record, 'endDateTime')
  const timeRange =
    parseTimeRange(pickField(record, 'timeNormalized')) ?? parseTimeRange(startDateTimeRaw)
  const startParts = parseSheetDateTime(startDateTimeRaw)
  const endParts = parseSheetDateTime(endDateTimeRaw)
  const date =
    startParts?.date ?? endParts?.date ?? parseSheetDate(pickField(record, 'date'))
  if (!date) return null

  const startTime = startParts?.time ?? timeRange?.startTime ?? '10:00'
  const endTime = endParts?.time ?? timeRange?.endTime ?? startTime
  const venue = pickField(record, 'venue').replace(/^📍\s*/, '')
  const room = sanitizeRoom(pickField(record, 'room'), venue)
  const address = pickField(record, 'address')
  const city = pickField(record, 'city')
  const geo = resolveGeo(
    venue,
    address,
    city,
    pickField(record, 'lat'),
    pickField(record, 'lng'),
    room,
  )
  const age = parseAgeRange(pickField(record, 'ageRange'))
  const publishing = resolvePublishingFields({
    statusRaw: pickField(record, 'status'),
    approvedRaw: pickField(record, 'approved'),
    isPastRaw: null,
    isLiveRaw: null,
    date,
    endTime,
  })

  const verifiedDate = parseSheetDate(pickField(record, 'verifiedDate')) ?? '2026-06-05'

  return enrichPublishingFields({
    id: deriveEventId(record),
    title,
    description: pickField(record, 'description').slice(0, 500),
    venue,
    ...(room ? { room } : {}),
    address: geo.address,
    city: geo.city,
    date,
    startTime,
    endTime,
    ageRange: age.label,
    ageMin: age.min,
    ageMax: age.max,
    types: parseActivityTypes(pickField(record, 'types')),
    categoryTags: parseCategoryTags(pickField(record, 'categoryTags')),
    cost: parseCost(pickField(record, 'cost')),
    imageUrl: pickField(record, 'imageUrl') || '',
    eventUrl: pickField(record, 'eventUrl') || '#',
    verifiedDate,
    lat: geo.lat,
    lng: geo.lng,
    status: publishing.status,
    isPast: publishing.isPast,
    isLive: publishing.isLive,
  })
}

export function parseSheetCsvToEvents(csvText: string): Event[] {
  const rows = rowsToObjects(parseCsv(csvText))
  return rows
    .map(mapRecord)
    .filter((event): event is Event => event !== null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
}

async function fetchSheetCsv(): Promise<string> {
  const response = await fetch(SHEET_CSV_PROXY_PATH, {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`Sheet fetch failed (${response.status})`)
  }
  const text = await response.text()
  if (!text.trim()) {
    throw new Error('Sheet export was empty')
  }
  return text
}

export async function refreshEventsFromSheet(): Promise<{ events: Event[]; refreshedAt: string }> {
  const csvText = await fetchSheetCsv()
  const events = parseSheetCsvToEvents(csvText)
  if (events.length === 0) {
    throw new Error('No events found in sheet export')
  }
  return { events, refreshedAt: new Date().toISOString() }
}

export const ADMIN_REFRESH_STORAGE_KEY = 'puddles-admin-refresh'

export function loadCachedAdminRefresh(): { events: Event[]; refreshedAt: string } | null {
  try {
    const raw = localStorage.getItem(ADMIN_REFRESH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { events: Event[]; refreshedAt: string }
    if (!Array.isArray(parsed.events) || !parsed.refreshedAt) return null
    return parsed
  } catch {
    return null
  }
}

export function saveCachedAdminRefresh(payload: { events: Event[]; refreshedAt: string }) {
  localStorage.setItem(ADMIN_REFRESH_STORAGE_KEY, JSON.stringify(payload))
}
