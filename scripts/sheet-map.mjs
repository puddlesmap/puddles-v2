const ACTIVITY_TYPES = [
  'Stories',
  'Music & Movement',
  'Arts & Crafts',
  'Build & Explore',
  'Outdoor',
  'Social & Play',
  'Classes',
  'Other',
]

export const VENUE_ALIASES = {
  'Mountain View Public Library': 'Mountain View Library',
  'Los Altos Public Library': 'Los Altos Library',
}

export const VENUE_GEO = {
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

export const VENUE_ADDRESSES = {
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

export function isDateLikeValue(value) {
  if (!value) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())
}

function canonicalVenue(venue) {
  return VENUE_ALIASES[venue] ?? venue
}

export function sanitizeAddress(venue, address) {
  const trimmed = String(address ?? '').trim()
  if (trimmed && !isDateLikeValue(trimmed)) return trimmed
  const canonical = canonicalVenue(venue)
  return VENUE_ADDRESSES[canonical] ?? ''
}

export function sanitizeRoom(room, venue) {
  const trimmed = String(room ?? '').trim()
  if (!trimmed || isDateLikeValue(trimmed)) return ''
  if (venue && trimmed.toLowerCase() === String(venue).trim().toLowerCase()) return ''
  return trimmed
}

const COLUMN_ALIASES = {
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
  isPast: ['is past', 'ispast'],
  isLive: ['is live', 'islive'],
  status: ['status'],
  verifiedDate: ['last checked date', 'last verified'],
  lng: ['longitude', 'longtitide', 'lng'],
  lat: ['latitude', 'lat'],
}

function normalizeHeader(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ')
}

export function pickField(record, fieldKey) {
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

export function parseCategoryTags(raw) {
  const parts = String(raw)
    .split(/[,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)

  const seen = new Set()
  const tags = []
  for (const part of parts) {
    const key = part.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(part)
  }
  return tags
}

export function parseSheetDate(value) {
  const raw = String(value).trim()
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

function clockTo24Hour(raw) {
  const m = String(raw)
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

export function parseTimeRange(value) {
  const norm = String(value).replace(/\s+/g, ' ').trim().toLowerCase()
  if (!norm) return null
  const parts = norm.split(/\s*[-–—]{1,2}\s*|\s+to\s+/)
  const startTime = clockTo24Hour(parts[0])
  const endTime = clockTo24Hour(parts[1] || parts[0])
  if (!startTime || !endTime) return null
  return { startTime, endTime }
}

export function parseSheetDateTime(value) {
  const raw = String(value).trim()
  if (!raw) return null
  const m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return null
  let hour = parseInt(m[4], 10)
  const min = m[5]
  const ap = m[6]?.toUpperCase()
  if (ap === 'PM' && hour < 12) hour += 12
  if (ap === 'AM' && hour === 12) hour = 0
  const year = m[3].length === 2 ? `20${m[3]}` : m[3]
  const date = `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  return { date, time: `${hour.toString().padStart(2, '0')}:${min}` }
}

export function parseActivityTypes(raw) {
  const parts = String(raw)
    .split(/[,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)

  const matched = []
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

export function parseAgeRange(raw) {
  const text = String(raw).trim()
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

export function parseCost(raw) {
  const value = String(raw).trim().toLowerCase()
  if (!value) return 'Free'
  if (value.includes('paid')) return 'Paid'
  if (value.includes('low')) return 'Low-cost'
  return 'Free'
}

export function normalizeCity(raw) {
  const value = String(raw).trim()
  if (value === 'Palo Alto' || value === 'Los Altos' || value === 'Mountain View') return value
  return 'Palo Alto'
}

export function deriveEventId(record) {
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

export function resolveGeo(venue, address, city, latRaw, lngRaw, room = '') {
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
