import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { parseCsv, rowsToObjects } from './csv.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const config = JSON.parse(readFileSync(join(rootDir, 'data/sheet-source.json'), 'utf8'))
const outputPath = join(rootDir, 'src/data/sheet-submissions.json')

function normalizeHeader(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ')
}

function pickField(record, aliases) {
  for (const [header, value] of Object.entries(record)) {
    const key = normalizeHeader(header)
    if (aliases.some((alias) => key === alias || key.includes(alias))) {
      return String(value ?? '').trim()
    }
  }
  return ''
}

function parseEventTypeFromNotes(notes) {
  const match = String(notes).match(/(One-time event|Recurring class)/)
  return match ? match[1] : ''
}

function mapRecord(record) {
  const eventName = pickField(record, ['event name', 'idea summary'])
  const submissionType = pickField(record, ['submission type']) || 'Event'
  const submittedAt = pickField(record, ['submitted date', 'submitted at'])
  const rawStatus = pickField(record, ['status']) || 'New'
  const status =
    rawStatus.toLowerCase() === 'reviewing'
      ? 'Needs review'
      : rawStatus.toLowerCase() === 'converted'
        ? 'Added to sheet'
        : rawStatus
  const id =
    pickField(record, ['submission id']) ||
    `${submissionType}-${submittedAt}-${eventName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)

  if (!id && !eventName && !submittedAt) return null

  return {
    id: id || `submission-${Date.now()}`,
    submittedAt,
    submissionType,
    status: status,
    eventType:
      pickField(record, ['event type']) ||
      parseEventTypeFromNotes(pickField(record, ['internal notes'])),
    eventName,
    locationName: pickField(record, ['location name']),
    address: pickField(record, ['address']),
    city: pickField(record, ['city']),
    date: pickField(record, ['date']),
    startTime: pickField(record, ['start time']),
    endTime: pickField(record, ['end time']),
    ageRange: pickField(record, ['age range']),
    costType: pickField(record, ['cost type']),
    costDetail: pickField(record, ['cost detail']),
    cost: pickField(record, ['cost']),
    signupRequirement: pickField(record, ['signup requirement', 'registration requirement']),
    signupLinkInfo: pickField(record, ['signup link / info', 'registration link / info']),
    eventDescription: pickField(record, ['event description']),
    parentTips: pickField(record, ['parent-to-parent tips', 'parent tips']),
    types: pickField(record, ['category / types', 'category', 'types', 'idea types']),
    link: pickField(record, ['link']),
    additionalInfo:
      pickField(record, ['parent-to-parent tips', 'parent tips']) ||
      pickField(record, ['additional info']),
    internalNotes: pickField(record, ['internal notes']),
    convertedEventId: pickField(record, ['converted event id']),
    submittedByEmail: pickField(record, ['submitted by email', 'email']),
  }
}

async function loadCsvText() {
  const gid = config.tabs.submissions.gid
  const exportUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/export?format=csv&gid=${gid}`
  const response = await fetch(exportUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch Submissions tab CSV (${response.status})`)
  }
  return response.text()
}

const csvText = await loadCsvText()
const rows = rowsToObjects(parseCsv(csvText))
const submissions = rows.map(mapRecord).filter(Boolean)

submissions.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

writeFileSync(outputPath, JSON.stringify(submissions, null, 2))
console.log(`Synced ${submissions.length} submissions from Submissions tab`)
console.log(`Wrote ${outputPath}`)
