#!/usr/bin/env node
/**
 * Weekly core-city weekend search ingest.
 *
 * Imports unprocessed rows from data/discovery/core-cities-weekend-inbox.json
 * (web / Instagram / Facebook leads) into Admin Discovery as pending rows.
 *
 * Usage: node scripts/discover-core-weekend.mjs
 *
 * Human/agent step (not automated): search official calendars + social for
 * this weekend and next → add leads with official URLs → run this script.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DISCOVERY_ADMIN_PATH,
  isUrlAlreadyOnPuddles,
  loadCatalogUrls,
  loadExistingDiscoveryCandidates,
  pacificTodayYmd,
  sortCandidates,
} from './discovery-shared.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const INBOX_PATH = join(rootDir, 'data/discovery/core-cities-weekend-inbox.json')
const REPORT_DIR = join(rootDir, 'data/discovery')

const SOURCE_PREFIX = 'Core cities · Weekend search'
const CORE_CITIES = new Set(['Palo Alto', 'Los Altos', 'Mountain View', 'Sunnyvale'])

function loadInbox() {
  try {
    return JSON.parse(readFileSync(INBOX_PATH, 'utf8'))
  } catch {
    return { leads: [] }
  }
}

function saveInbox(inbox) {
  inbox.updatedAt = pacificTodayYmd()
  writeFileSync(INBOX_PATH, `${JSON.stringify(inbox, null, 2)}\n`)
}

function normalizeLeadToCandidate(lead) {
  const eventUrl = String(lead.eventUrl ?? '').trim()
  if (!eventUrl.startsWith('http')) {
    throw new Error(`Lead "${lead.title}" missing official eventUrl`)
  }

  const date = String(lead.date ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Lead "${lead.title}" needs date YYYY-MM-DD`)
  }

  const city = String(lead.city ?? '').trim()
  if (!CORE_CITIES.has(city)) {
    throw new Error(
      `Lead "${lead.title}" city "${city}" is outside core cities — use data/discovery/regional-leads-inbox.json`,
    )
  }

  const leadSource = lead.leadSource ?? 'web'
  const sourceLabel = `${SOURCE_PREFIX} · ${leadSource}`

  const id =
    lead.id ??
    `core-weekend-${date}-${String(lead.title ?? 'event')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 48)}`

  return {
    id,
    title: String(lead.title ?? '').trim(),
    date,
    startTime: lead.startTime ?? '',
    endTime: lead.endTime ?? '',
    venue: lead.venue ?? '',
    room: lead.room ?? '',
    address: lead.address ?? '',
    city,
    lat: lead.lat ?? null,
    lng: lead.lng ?? null,
    ageRange: lead.ageRange ?? 'All ages · Little ones welcome',
    ageMin: lead.ageMin ?? 0,
    ageMax: lead.ageMax ?? 5,
    audiences: '',
    types: lead.types ?? ['Festivals & Community', 'Outdoor'],
    categoryTags: ['Weekend search', ...(lead.categoryTags ?? [])],
    cost: lead.cost ?? '',
    description: lead.description ?? '',
    tips: lead.tips ?? (lead.leadNotes ? `Lead note: ${lead.leadNotes}` : ''),
    imageUrl: lead.imageUrl ?? '',
    eventUrl,
    source: sourceLabel,
    watchlistSourceId: lead.watchlistSourceId ?? '',
    isCancelled: false,
    isRecurring: false,
    alreadyOnPuddles: false,
    reviewStatus: 'pending',
    convertedEventId: '',
    lastChecked: pacificTodayYmd(),
  }
}

function ingestInboxLeads() {
  const inbox = loadInbox()
  const catalogUrls = loadCatalogUrls()
  const existing = loadExistingDiscoveryCandidates()
  const existingIds = new Set(existing.map((row) => row.id))
  const existingUrls = new Set(
    existing.map((row) => row.eventUrl?.replace(/\/$/, '')).filter(Boolean),
  )

  const added = []
  const errors = []

  for (const lead of inbox.leads ?? []) {
    if (lead.processed) continue
    try {
      const row = normalizeLeadToCandidate(lead)
      const normalizedUrl = row.eventUrl.replace(/\/$/, '')
      if (existingIds.has(row.id)) {
        lead.processed = true
        lead.processedAt = pacificTodayYmd()
        lead.skipReason = 'duplicate id'
        continue
      }
      if (existingUrls.has(normalizedUrl)) {
        lead.processed = true
        lead.processedAt = pacificTodayYmd()
        lead.skipReason = 'duplicate url in queue'
        continue
      }
      if (isUrlAlreadyOnPuddles(row.eventUrl, catalogUrls)) {
        lead.processed = true
        lead.processedAt = pacificTodayYmd()
        lead.skipReason = 'already on Puddles catalog'
        continue
      }

      added.push(row)
      existingIds.add(row.id)
      existingUrls.add(normalizedUrl)
      lead.processed = true
      lead.processedAt = pacificTodayYmd()
      lead.queuedId = row.id
    } catch (err) {
      errors.push(String(err.message ?? err))
    }
  }

  if (added.length > 0) {
    const raw = JSON.parse(readFileSync(DISCOVERY_ADMIN_PATH, 'utf8'))
    const candidates = sortCandidates([...existing, ...added])
    const sources = new Set([...(raw.sources ?? []), ...added.map((row) => row.source)])
    writeFileSync(
      DISCOVERY_ADMIN_PATH,
      `${JSON.stringify(
        {
          ...raw,
          generatedAt: new Date().toISOString(),
          sources: [...sources].sort(),
          candidates,
        },
        null,
        2,
      )}\n`,
    )
  }

  saveInbox(inbox)
  return { added, errors, inbox }
}

function writeWeeklyReport() {
  const today = pacificTodayYmd()
  const discovery = JSON.parse(readFileSync(DISCOVERY_ADMIN_PATH, 'utf8'))
  const pending = (discovery.candidates ?? []).filter(
    (row) =>
      String(row.source ?? '').startsWith(SOURCE_PREFIX) && row.reviewStatus === 'pending',
  )

  pending.sort((a, b) => String(a.date).localeCompare(String(b.date)))

  const lines = [
    '# Core cities — weekend search review',
    '',
    `Generated: ${today}`,
    '',
    'Pending **Core cities · Weekend search** rows in Admin Discovery.',
    'These are Palo Alto / Los Altos / Mountain View / Sunnyvale — Approve → Go live when copy checks out.',
    '',
    `**Pending count:** ${pending.length}`,
    '',
  ]

  if (pending.length === 0) {
    lines.push(
      '_No pending weekend-search rows. Run the web/social pass (see docs/core-cities-weekend-search.md), add leads to `data/discovery/core-cities-weekend-inbox.json`, then re-run this script._',
    )
  } else {
    lines.push('| Date | Title | City | Source |', '| --- | --- | --- | --- |')
    for (const row of pending) {
      lines.push(
        `| ${row.date} | ${row.title.replace(/\|/g, '\\|')} | ${row.city || '—'} | ${row.source.replace(/\|/g, '\\|')} |`,
      )
    }
  }

  lines.push(
    '',
    '## Weekly human / agent step',
    '',
    '1. Search official calendars + Instagram for **this weekend and next** in the four core cities.',
    '2. Fact-check on the official host page.',
    '3. Add keepers to `data/discovery/core-cities-weekend-inbox.json`.',
    '4. Run `npm run discover:core-weekend` (or wait for Thursday GitHub Action).',
    '5. Review in `/admin/discovery` → Approve → Go live.',
    '',
    '## Commands',
    '',
    '- `npm run discover:core-weekend` — ingest inbox + this report',
    '- `npm run discover:regional-weekly` — out-of-area Worth a Drive / 小紅書',
    '',
  )

  mkdirSync(REPORT_DIR, { recursive: true })
  const reportPath = join(REPORT_DIR, `core-weekend-${today}.md`)
  writeFileSync(reportPath, `${lines.join('\n')}\n`)
  return { reportPath, pendingCount: pending.length }
}

function main() {
  console.log('Core cities weekend search ingest\n')

  const { added, errors } = ingestInboxLeads()
  if (added.length > 0) {
    console.log(`Queued ${added.length} inbox lead(s):`)
    for (const row of added) {
      console.log(`  ${row.date}  ${row.title}  ·  ${row.city}`)
    }
  } else {
    console.log('No new inbox leads to queue.')
  }
  if (errors.length > 0) {
    console.warn('\nInbox errors (fix leads and re-run):')
    for (const err of errors) console.warn(`  - ${err}`)
  }

  const { reportPath, pendingCount } = writeWeeklyReport()
  console.log(`\nPending weekend-search rows: ${pendingCount}`)
  console.log(`Report: ${reportPath}`)
  console.log('\nNext: /admin/discovery — filter Source for "Core cities · Weekend search"')
}

main()
