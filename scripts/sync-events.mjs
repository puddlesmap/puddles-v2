import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { parseCsv, rowsToObjects } from './csv.mjs'
import {
  deriveEventId,
  parseActivityTypes,
  parseCategoryTags,
  parseSheetDate,
  parseSheetDateTime,
  parseTimeRange,
  pickField,
  resolveEventAge,
  resolveEventCost,
  resolveGeo,
  sanitizeRoom,
} from './sheet-map.mjs'
import { resolvePublishingFields, computeIsPast } from './publishing.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const config = JSON.parse(readFileSync(join(rootDir, 'data/sheet-source.json'), 'utf8'))
const syncConfig = JSON.parse(readFileSync(join(rootDir, 'src/data/sync-config.json'), 'utf8'))
const outputPath = join(rootDir, 'src/data/sheet-events.json')
const metaPath = join(rootDir, 'src/data/sync-meta.json')

const PUBLISHING_REFERENCE = process.env.PUBLISHING_REFERENCE_DATE
  ? new Date(process.env.PUBLISHING_REFERENCE_DATE)
  : new Date()

async function loadCsvText() {
  const localPath = join(rootDir, config.localExportPath)
  if (process.env.SHEET_CSV_URL) {
    const response = await fetch(process.env.SHEET_CSV_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet CSV (${response.status})`)
    }
    return response.text()
  }

  const eventsGid = config.tabs.events.gid
  const exportUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/export?format=csv&gid=${eventsGid}`

  try {
    const response = await fetch(exportUrl)
    if (response.ok) {
      const text = await response.text()
      writeFileSync(localPath, text)
      return text
    }
  } catch {
    // Fall back to cached export.
  }

  return readFileSync(localPath, 'utf8')
}

function mapRecord(record) {
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
  const verifiedDateRaw = pickField(record, 'verifiedDate')
  const verifiedDate = parseSheetDate(verifiedDateRaw) ?? '2026-06-05'
  const tips = pickField(record, 'tips')
  // Infer ages from full description before truncating for storage.
  const descriptionFull = pickField(record, 'description')
  const age = resolveEventAge(pickField(record, 'ageRange'), descriptionFull, tips)
  const publishing = resolvePublishingFields({
    statusRaw: pickField(record, 'status'),
    approvedRaw: pickField(record, 'approved'),
    isPastRaw: null,
    isLiveRaw: null,
    date,
    endTime,
    referenceDate: PUBLISHING_REFERENCE,
  })

  return {
    id: deriveEventId(record),
    title,
    description: descriptionFull,
    ...(tips ? { tips } : {}),
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
    cost: resolveEventCost(pickField(record, 'cost'), descriptionFull, tips),
    imageUrl: pickField(record, 'imageUrl') || '',
    eventUrl: pickField(record, 'eventUrl') || '#',
    verifiedDate,
    lat: geo.lat,
    lng: geo.lng,
    status: publishing.status,
    isPast: publishing.isPast,
    isLive: publishing.isLive,
  }
}

const csvText = await loadCsvText()
const rows = rowsToObjects(parseCsv(csvText))
let events = rows.map(mapRecord).filter(Boolean)

// Sheet sync must not demote Admin Go live events back to Draft.
// Those rows often land on the Sheet as Draft while the public catalog already Published them.
let previousById = new Map()
try {
  const previous = JSON.parse(readFileSync(outputPath, 'utf8'))
  if (Array.isArray(previous)) {
    previousById = new Map(previous.map((event) => [event.id, event]))
  }
} catch {
  // First sync or missing file — nothing to preserve.
}

let preservedPublishCount = 0
events = events.map((event) => {
  const previous = previousById.get(event.id)
  if (!previous) return event
  if (previous.status !== 'Published') return event
  if (event.status !== 'Draft') return event

  const isPast = computeIsPast(event.date, event.endTime, PUBLISHING_REFERENCE)
  preservedPublishCount += 1
  return {
    ...event,
    status: isPast ? 'Expired' : 'Published',
    isPast,
    isLive: !isPast,
  }
})

events.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
writeFileSync(outputPath, `${JSON.stringify(events, null, 2)}\n`)

const liveCount = events.filter((event) => event.isLive).length
const syncedAt = new Date().toISOString()
writeFileSync(
  metaPath,
  JSON.stringify(
    {
      syncedAt,
      eventCount: events.length,
      liveCount,
      spreadsheetId: config.spreadsheetId,
      tab: config.tabs.events.name,
      scheduleLabel: syncConfig.scheduleLabel,
      scheduleCron: syncConfig.scheduleCron,
    },
    null,
    2,
  ),
)

console.log(`Synced ${events.length} events from Events tab (${liveCount} live)`)
if (preservedPublishCount > 0) {
  console.log(`Preserved Published status for ${preservedPublishCount} Admin Go live event(s)`)
}
console.log(`Wrote ${outputPath}`)
console.log(`Wrote ${metaPath} (${syncedAt})`)
