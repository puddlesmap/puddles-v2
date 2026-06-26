import type { ActivityType, City, Event } from '../types/event'
import { SHEET_CSV_PROXY_PATH, SHEET_SOURCE } from '../data/sheet-source'
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

const COLUMN_ALIASES: Record<string, string[]> = {
  eventId: ['event id', 'softr record id'],
  title: ['title', 'titel', 'short title'],
  description: ['event description', 'description', 'event preview'],
  venue: ['venue', 'display location short', 'display location'],
  address: ['address'],
  city: ['city'],
  date: ['event date', 'start date'],
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

  const nums = [...text.matchAll(/(\d+)\s*[-–]\s*(\d+)/g)].map((match) => [
    parseInt(match[1], 10),
    parseInt(match[2], 10),
  ])

  if (nums.length === 0) {
    if (/all/i.test(text)) return { min: 0, max: 12, label: 'All ages' }
    return { min: 0, max: 5, label: '0–5' }
  }

  const min = Math.min(...nums.map(([a]) => a))
  const max = Math.max(...nums.map(([, b]) => b))
  return { min, max, label: `${min}–${max}` }
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

function resolveGeo(venue: string, address: string, city: string, latRaw: string, lngRaw: string) {
  const lat = parseFloat(latRaw)
  const lng = parseFloat(lngRaw)
  const fallback = VENUE_GEO[venue]

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { address, city: normalizeCity(city), lat, lng }
  }

  if (fallback) {
    return {
      address: address || venue,
      city: normalizeCity(city || fallback.city),
      lat: fallback.lat,
      lng: Number.isFinite(lng) ? lng : fallback.lng,
    }
  }

  return {
    address: address || venue,
    city: normalizeCity(city),
    lat: Number.isFinite(lat) ? lat : 37.44,
    lng: Number.isFinite(lng) ? lng : -122.14,
  }
}

function mapRecord(record: Record<string, string>): Event | null {
  const title = pickField(record, 'title')
  if (!title) return null

  const startParts = parseSheetDateTime(pickField(record, 'startDateTime'))
  const endParts = parseSheetDateTime(pickField(record, 'endDateTime'))
  const date = startParts?.date ?? parseSheetDate(pickField(record, 'date'))
  if (!date) return null

  const startTime = startParts?.time ?? '10:00'
  const endTime = endParts?.time ?? startTime
  const venue = pickField(record, 'venue').replace(/^📍\s*/, '')
  const address = pickField(record, 'address')
  const city = pickField(record, 'city')
  const geo = resolveGeo(venue, address, city, pickField(record, 'lat'), pickField(record, 'lng'))
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
    imageUrl:
      pickField(record, 'imageUrl') ||
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=500&fit=crop',
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
  const urls = [SHEET_CSV_PROXY_PATH, SHEET_SOURCE.csvExportUrl]
  let lastError: Error | null = null

  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) {
        lastError = new Error(`Sheet fetch failed (${response.status})`)
        continue
      }
      const text = await response.text()
      if (!text.trim()) {
        lastError = new Error('Sheet export was empty')
        continue
      }
      return text
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Could not reach Google Sheet')
    }
  }

  throw lastError ?? new Error('Could not refresh from Google Sheet')
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
