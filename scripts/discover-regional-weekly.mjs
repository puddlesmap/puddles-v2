#!/usr/bin/env node
/**
 * Weekly regional discovery pass — Bay Area destination events for Admin review.
 *
 * 1. Re-ingest watchlist + Regional · Worth a Drive rows (official pages).
 * 2. Import unprocessed rows from data/discovery/regional-leads-inbox.json
 *    (e.g. 小紅書 leads you pasted with official event URLs).
 * 3. Write a short report of pending Regional candidates.
 *
 * Usage: node scripts/discover-regional-weekly.mjs
 *
 * Human step (not automated): search 小紅書 / Bay Area parent accounts for
 * festival roundups → add leads with official links → run this script.
 */
import { spawnSync } from 'node:child_process'
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
const INBOX_PATH = join(rootDir, 'data/discovery/regional-leads-inbox.json')
const REPORT_DIR = join(rootDir, 'data/discovery')

const REGIONAL_SOURCE_PREFIX = 'Regional ·'

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
  if (/xiaohongshu|xhslink|little red book/i.test(eventUrl)) {
    throw new Error(`Lead "${lead.title}" must use the host official page, not a 小紅書 link`)
  }

  const date = String(lead.date ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Lead "${lead.title}" needs date YYYY-MM-DD`)
  }

  const leadSource = lead.leadSource ?? 'editorial'
  const sourceLabel =
    leadSource === 'xiaohongshu'
      ? 'Regional · Lead · 小紅書'
      : `Regional · Lead · ${leadSource}`

  const id =
    lead.id ??
    `regional-lead-${date}-${String(lead.title ?? 'event')
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
    room: '',
    address: lead.address ?? '',
    city: lead.city ?? '',
    lat: lead.lat ?? null,
    lng: lead.lng ?? null,
    ageRange: lead.ageRange ?? 'All ages · Little ones welcome',
    ageMin: lead.ageMin ?? 0,
    ageMax: lead.ageMax ?? 5,
    audiences: '',
    types: lead.types ?? ['Festivals & Community', 'Outdoor'],
    categoryTags: ['Regional', 'Worth a Drive', ...(lead.categoryTags ?? [])],
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
  const regional = (discovery.candidates ?? []).filter(
    (row) =>
      String(row.source ?? '').startsWith(REGIONAL_SOURCE_PREFIX) &&
      row.reviewStatus === 'pending',
  )

  regional.sort((a, b) => String(a.date).localeCompare(String(b.date)))

  const lines = [
    '# Regional discovery — weekly review',
    '',
    `Generated: ${today}`,
    '',
    'Pending **Regional ·** rows in Admin Discovery (Worth a Drive / 小紅書 leads).',
    'Approve only after checking the **official** event page.',
    '',
    `**Pending count:** ${regional.length}`,
    '',
  ]

  if (regional.length === 0) {
    lines.push('_No pending regional rows. Add leads to `data/discovery/regional-leads-inbox.json` or extend Calendar Watchlist._')
  } else {
    lines.push('| Date | Title | City | Source |', '| --- | --- | --- | --- |')
    for (const row of regional) {
      lines.push(
        `| ${row.date} | ${row.title.replace(/\|/g, '\\|')} | ${row.city || '—'} | ${row.source.replace(/\|/g, '\\|')} |`,
      )
    }
  }

  lines.push(
    '',
    '## Weekly human step (小紅書)',
    '',
    '1. Search Bay Area parent accounts for weekend / holiday roundups (e.g. Labor Day, Halloween, pumpkin season).',
    '2. For each fit: find the **official** host page — not the XHS post URL.',
    '3. Add a row to `data/discovery/regional-leads-inbox.json` with `leadSource: "xiaohongshu"`.',
    '4. Run `npm run discover:regional-weekly` (or wait for Friday GitHub Action).',
    '5. Review in `/admin/discovery` → Approve → Go live → Hello Fall / seasonal drive as appropriate.',
    '',
    '## Commands',
    '',
    '- `npm run discover:regional-weekly` — ingest watchlist + inbox + this report',
    '- `npm run discover:ingest-expansion` — watchlist expansion rows only',
    '',
  )

  mkdirSync(REPORT_DIR, { recursive: true })
  const reportPath = join(REPORT_DIR, `regional-weekly-${today}.md`)
  writeFileSync(reportPath, `${lines.join('\n')}\n`)
  return { reportPath, pendingCount: regional.length }
}

function main() {
  console.log('Regional weekly discovery pass\n')

  const ingest = spawnSync(process.execPath, [join(__dirname, 'ingest-watchlist-expansion.mjs')], {
    cwd: rootDir,
    stdio: 'inherit',
  })
  if (ingest.status !== 0) {
    process.exit(ingest.status ?? 1)
  }

  const { added, errors } = ingestInboxLeads()
  if (added.length > 0) {
    console.log(`\nQueued ${added.length} inbox lead(s):`)
    for (const row of added) {
      console.log(`  ${row.date}  ${row.title}  ·  ${row.city}`)
    }
  } else {
    console.log('\nNo new inbox leads to queue.')
  }
  if (errors.length > 0) {
    console.warn('\nInbox errors (fix leads and re-run):')
    for (const err of errors) console.warn(`  - ${err}`)
  }

  const { reportPath, pendingCount } = writeWeeklyReport()
  console.log(`\nPending regional rows: ${pendingCount}`)
  console.log(`Report: ${reportPath}`)
  console.log('\nNext: /admin/discovery — filter Source for "Regional ·"')
}

main()
