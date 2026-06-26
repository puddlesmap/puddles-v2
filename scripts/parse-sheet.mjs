import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import {
  DEFAULT_PUBLISHING_REFERENCE,
  resolvePublishingFields,
} from './publishing.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const mdPath = join(__dirname, '../data/raw-events-export.md')

const VENUE_CITY = {
  'Downtown Library': { city: 'Palo Alto', address: '270 Forest Ave, Palo Alto, CA', lat: 37.4443, lng: -122.1598 },
  'College Terrace Library': { city: 'Palo Alto', address: '2300 Wellesley St, Palo Alto, CA', lat: 37.4221, lng: -122.1381 },
  'Mitchell Park Library': { city: 'Palo Alto', address: '3700 Middlefield Rd, Palo Alto, CA', lat: 37.4177, lng: -122.1288 },
  'Rinconada Library': { city: 'Palo Alto', address: '1213 Newell Rd, Palo Alto, CA', lat: 37.4281, lng: -122.1425 },
  "Children's Library": { city: 'Palo Alto', address: '1276 Harriet St, Palo Alto, CA', lat: 37.4419, lng: -122.143 },
  'Mountain View Library': { city: 'Mountain View', address: '585 Franklin St, Mountain View, CA', lat: 37.3895, lng: -122.0818 },
  'Mountain View Magical Bridge': { city: 'Mountain View', address: 'Rengstorff Park, Mountain View, CA', lat: 37.395, lng: -122.088 },
  'Pioneer Park': { city: 'Mountain View', address: '525 Church St, Mountain View, CA', lat: 37.3945, lng: -122.0786 },
  'Deer Hollow Farm': { city: 'Mountain View', address: '22500 Cristo Rey Dr, Cupertino, CA', lat: 37.319, lng: -122.085 },
  'Los Altos Library': { city: 'Los Altos', address: '13 S San Antonio Rd, Los Altos, CA', lat: 37.3791, lng: -122.1142 },
}

const PUBLISHING_REFERENCE = new Date(
  process.env.PUBLISHING_REFERENCE_DATE ?? DEFAULT_PUBLISHING_REFERENCE,
)

const PUBLISHING_COLUMN_ALIASES = {
  status: ['status'],
  approved: ['approved'],
  isPast: ['is past', 'ispast'],
  isLive: ['is live', 'islive'],
}

function parseDate(s) {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!m) return null
  const year = m[3].length === 2 ? `20${m[3]}` : m[3]
  return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
}

function parseTimeRange(s) {
  const norm = s.replace(/\s+/g, ' ').trim().toLowerCase()
  const parts = norm.split(/\s*[-–—]{1,2}\s*|\s+to\s+/)
  function to24(t) {
    const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
    if (!m) return '10:00'
    let h = parseInt(m[1], 10)
    const min = m[2] || '00'
    const ap = m[3]
    if (ap === 'pm' && h < 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    return `${h.toString().padStart(2, '0')}:${min}`
  }
  return { start: to24(parts[0]), end: to24(parts[1] || parts[0]) }
}

function mapTypes(raw) {
  const r = raw.toLowerCase()
  const types = []
  if (r.includes('story')) types.push('Stories')
  if (r.includes('music') || r.includes('concert') || r.includes('movement')) types.push('Music & Movement')
  if (r.includes('art') || r.includes('craft')) types.push('Arts & Crafts')
  if (r.includes('outdoor') || r.includes('park')) types.push('Outdoor')
  if (r.includes('lego') || r.includes('steam') || r.includes('gaming') || r.includes('build'))
    types.push('Build & Explore')
  if (r.includes('play') || r.includes('social') || r.includes('celebration'))
    types.push('Social & Play')
  if (r.includes('class') || r.includes('parenting')) types.push('Classes')
  if (types.length === 0) types.push('Other')
  return [...new Set(types)]
}

function parseAge(audience) {
  const a = audience.toLowerCase()
  let min = 0
  let max = 5
  let label = '0–5'
  if (a.includes('baby') || a.includes('infant') || a.includes('under 2')) {
    min = 0
    max = 2
    label = '0–2'
  } else if (a.includes('toddler') || a.includes('18 mos')) {
    min = 0
    max = 3
    label = '0–3'
  } else if (a.includes('pre-school') || a.includes('preschool')) {
    min = 2
    max = 5
    label = '2–5'
  }
  if (a.includes('adults') && !a.includes('baby') && !a.includes('child')) {
    return { min: 18, max: 99, label: 'Adults' }
  }
  return { min, max, label }
}

function splitCells(line) {
  return line
    .split('|')
    .slice(2, -1)
    .map((c) => c.trim().replace(/\\n/g, ' ').replace(/\\/g, ''))
}

function normalizeHeader(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function buildColumnMap(headerCells) {
  const map = {}
  headerCells.forEach((cell, index) => {
    const key = normalizeHeader(cell)
    if (!key) return
    for (const [field, aliases] of Object.entries(PUBLISHING_COLUMN_ALIASES)) {
      if (aliases.some((alias) => key === alias || key.includes(alias))) {
        map[field] = index
      }
    }
  })
  return map
}

function cellValue(cells, index) {
  if (index == null || index < 0 || index >= cells.length) return ''
  return cells[index]
}

const md = readFileSync(mdPath, 'utf8')
const lines = md.split('\n')

let publishingColumns = {}
const dataLines = []

for (const line of lines) {
  if (/^\| \d+\s+\|/.test(line)) {
    dataLines.push(line)
    continue
  }
  if (/^\|\s*\d+\s*\|\s*Raw Title/i.test(line)) {
    publishingColumns = buildColumnMap(splitCells(line))
  }
}

const raw = []
const seen = new Set()

for (const line of dataLines) {
  const cells = splitCells(line)
  if (cells.length < 6) continue

  const title = cells[0]
  const description = cells[1]
  const venue = cells[2]

  let dateStr = null
  let timeStr = null
  let audience = ''
  let category = ''
  let imageUrl = ''
  let eventUrl = ''

  for (let i = 3; i < cells.length; i++) {
    const c = cells[i]
    if (!dateStr && parseDate(c)) dateStr = c
    else if (!timeStr && /\d{1,2}(:\d{2})?\s*(am|pm|--)/i.test(c)) timeStr = c
    else if (!audience && /baby|kid|toddler|pre-school|adult|child|famil|tween/i.test(c))
      audience = c
    else if (!category && !c.startsWith('http') && c.length > 0 && c.length < 80) category = c
    else if (!imageUrl && c.startsWith('http') && (c.includes('image') || c.includes('png') || c.includes('jpg') || c.includes('cloudfront') || c.includes('uploads')))
      imageUrl = c.replace(/\\_/g, '_')
    else if (!eventUrl && c.startsWith('http') && (c.includes('event') || c.includes('libcal') || c.includes('bibliocommons')))
      eventUrl = c
  }

  if (!title || !venue || !dateStr || !timeStr) continue

  const dedupeKey = `${title}|${venue}|${dateStr}|${timeStr}`
  if (seen.has(dedupeKey)) continue
  seen.add(dedupeKey)

  const date = parseDate(dateStr)
  const { start, end } = parseTimeRange(timeStr)
  const geo = VENUE_CITY[venue] || { city: 'Palo Alto', address: venue, lat: 37.44, lng: -122.14 }
  const age = parseAge(audience)
  const types = mapTypes(`${category} ${title} ${description}`)

  const publishing = resolvePublishingFields({
    statusRaw: cellValue(cells, publishingColumns.status),
    approvedRaw: cellValue(cells, publishingColumns.approved),
    isPastRaw: null,
    isLiveRaw: null,
    date,
    endTime: end,
    referenceDate: PUBLISHING_REFERENCE,
  })

  raw.push({
    title,
    description: description.slice(0, 300),
    venue,
    address: geo.address,
    city: geo.city,
    date,
    startTime: start,
    endTime: end,
    ageRange: age.label,
    ageMin: age.min,
    ageMax: age.max,
    types,
    cost: 'Free',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=500&fit=crop',
    eventUrl: eventUrl || '#',
    verifiedDate: '2026-05-25',
    lat: geo.lat,
    lng: geo.lng,
    status: publishing.status,
    isPast: publishing.isPast,
    isLive: publishing.isLive,
  })
}

raw.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
const withIds = raw.map((e, i) => ({ id: String(i + 1), ...e }))

writeFileSync(join(__dirname, '../src/data/sheet-events.json'), JSON.stringify(withIds, null, 2))

const liveCount = withIds.filter((e) => e.isLive).length
console.log(`Parsed ${withIds.length} unique events (${liveCount} live at reference date)`)
